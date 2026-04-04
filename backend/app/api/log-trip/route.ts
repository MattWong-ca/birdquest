import {
  AccountId,
  Client,
  PrivateKey,
  TokenId,
  TokenMintTransaction,
  TopicId,
  TopicMessageSubmitTransaction,
  TransferTransaction,
} from '@hashgraph/sdk';
import { createClient } from '@supabase/supabase-js';
import { findBird } from '../../lib/birds';

// ── Hedera client (singleton) ─────────────────────────────────────────────────

const hederaClient = Client.forTestnet().setOperator(
  AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
  PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
);

// ── Supabase client (singleton) ───────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface BirdEntry {
  id: string;
  name: string;
  count: number;
  timestamp: string;
  lat: number;
  lon: number;
}

interface LogTripBody {
  walletAddress: string;
  duration: number;   // seconds
  distance: number;   // meters
  birds: BirdEntry[];
  startLat: number;
  startLon: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function submitHCS(body: LogTripBody, score: number) {
  const topicId = TopicId.fromString(process.env.HEDERA_TOPIC_ID!);
  const message = JSON.stringify({
    wallet: body.walletAddress,
    duration: body.duration,
    distance: body.distance,
    startLat: body.startLat,
    startLon: body.startLon,
    birdCount: body.birds.reduce((sum, b) => sum + b.count, 0),
    species: body.birds.map(b => ({ name: b.name, count: b.count })),
    score,
    timestamp: new Date().toISOString(),
  });

  const receipt = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(message)
    .execute(hederaClient);

  const txReceipt = await receipt.getReceipt(hederaClient);
  return { sequenceNumber: txReceipt.topicSequenceNumber?.toString() };
}

// ── Scoring ───────────────────────────────────────────────────────────────────

const RARITY_PTS: Record<string, number> = { Common: 1, Uncommon: 2, Rare: 5 };

function calcScore(body: LogTripBody): number {
  const distanceKm = body.distance / 1000;
  const distancePts = distanceKm * 10;
  const timePts = (body.duration / 60 / 10) * 5;
  const birdPts = body.birds.reduce((sum, b) => {
    const bird = findBird(b.name);
    return sum + (RARITY_PTS[bird?.rarity ?? 'Common'] ?? 1) * b.count;
  }, 0);
  return Math.round(distancePts + timePts + birdPts);
}

async function mintBirdTokens(walletAddress: string, score: number) {
  if (score === 0) return { minted: 0 };

  const tokenId = TokenId.fromString(process.env.HEDERA_TOKEN_ID!);
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);

  // Mint tokens to operator treasury first
  const mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setAmount(score)
    .execute(hederaClient);

  await mintTx.getReceipt(hederaClient);

  // Transfer to user's EVM address
  const recipientId = AccountId.fromEvmAddress(0, 0, walletAddress);
  const transferTx = await new TransferTransaction()
    .addTokenTransfer(tokenId, operatorId, -score)
    .addTokenTransfer(tokenId, recipientId, score)
    .execute(hederaClient);

  await transferTx.getReceipt(hederaClient);
  return { minted: score };
}

async function logToSupabase(body: LogTripBody, score: number) {
  const totalBirds = body.birds.reduce((sum, b) => sum + b.count, 0);

  const { data, error } = await supabase
    .from('trips')
    .insert({
      wallet_address: body.walletAddress,
      duration_seconds: body.duration,
      distance_meters: body.distance,
      total_birds: totalBirds,
      species_count: body.birds.length,
      birds: body.birds,
      start_lat: body.startLat,
      start_lon: body.startLon,
      score,
      logged_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return { tripId: data.id };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: LogTripBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.walletAddress || !Array.isArray(body.birds)) {
    return Response.json({ error: 'Missing walletAddress or birds' }, { status: 400 });
  }

  const score = calcScore(body);

  const [hcsResult, htsResult, dbResult] = await Promise.allSettled([
    submitHCS(body, score),
    mintBirdTokens(body.walletAddress, score),
    logToSupabase(body, score),
  ]);

  return Response.json(
    {
      score,
      hcs: hcsResult.status === 'fulfilled' ? hcsResult.value : { error: hcsResult.reason?.message },
      hts: htsResult.status === 'fulfilled' ? htsResult.value : { error: htsResult.reason?.message },
      db:  dbResult.status  === 'fulfilled' ? dbResult.value  : { error: dbResult.reason?.message  },
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
