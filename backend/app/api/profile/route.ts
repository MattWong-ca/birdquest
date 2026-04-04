import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MIRROR_BASE = 'https://testnet.mirrornode.hedera.com/api/v1';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getBirdBalance(evmAddress: string): Promise<number> {
  const tokenId = process.env.HEDERA_TOKEN_ID!;
  const res = await fetch(
    `${MIRROR_BASE}/accounts/${evmAddress}/tokens?token.id=${tokenId}&limit=1`
  );
  const data = await res.json();
  const token = data.tokens?.[0];
  return token ? Number(token.balance) : 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return Response.json({ error: 'Missing wallet' }, { status: 400, headers: CORS });
  }

  const [balanceResult, tripsResult] = await Promise.allSettled([
    getBirdBalance(wallet),
    supabase
      .from('trips')
      .select('id, logged_at, duration_seconds, distance_meters, total_birds, species_count, score')
      .eq('wallet_address', wallet)
      .order('logged_at', { ascending: false })
      .limit(50),
  ]);

  const birdBalance = balanceResult.status === 'fulfilled' ? balanceResult.value : 0;
  const trips = tripsResult.status === 'fulfilled' ? (tripsResult.value.data ?? []) : [];

  return Response.json({ birdBalance, trips }, { headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
