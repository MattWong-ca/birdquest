import { AccountId, Client, Hbar, PrivateKey, TransferTransaction } from '@hashgraph/sdk';
import { createClient } from '@supabase/supabase-js';

const hederaClient = Client.forTestnet().setOperator(
  AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
  PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const PROMO_HBAR = 10;

export async function POST(request: Request) {
  let body: { walletAddress: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS });
  }

  if (!body.walletAddress) {
    return Response.json({ error: 'Missing walletAddress' }, { status: 400, headers: CORS });
  }

  // Check already claimed
  const { data: existing } = await supabase
    .from('promo_claims')
    .select('wallet_address')
    .eq('wallet_address', body.walletAddress)
    .maybeSingle();

  if (existing) {
    return Response.json({ error: 'Already claimed' }, { status: 409, headers: CORS });
  }

  // Send HBAR
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const recipientId = AccountId.fromEvmAddress(0, 0, body.walletAddress);

  const tx = await new TransferTransaction()
    .addHbarTransfer(operatorId, Hbar.fromTinybars(-PROMO_HBAR * 100_000_000))
    .addHbarTransfer(recipientId, Hbar.fromTinybars(PROMO_HBAR * 100_000_000))
    .execute(hederaClient);

  const receipt = await tx.getReceipt(hederaClient);

  // Record claim
  await supabase.from('promo_claims').insert({ wallet_address: body.walletAddress });

  return Response.json(
    { success: true, hbar: PROMO_HBAR, status: receipt.status.toString() },
    { headers: CORS }
  );
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
