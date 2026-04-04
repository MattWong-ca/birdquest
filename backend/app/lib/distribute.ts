import {
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  ScheduleCreateTransaction,
  Timestamp,
  TransferTransaction,
} from '@hashgraph/sdk';
import { createClient } from '@supabase/supabase-js';

const hederaClient = Client.forTestnet().setOperator(
  AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
  PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Payout {
  wallet: string;
  hbar: number;
}

interface DistributeResult {
  questId: string;
  scheduleId: string;
  expiresAt: string;
  payouts: Payout[];
  hashscanUrl: string;
}

export async function distributeQuest(questId: string): Promise<DistributeResult> {
  const { data: quest, error: qErr } = await supabase
    .from('quests')
    .select('*')
    .eq('id', questId)
    .single();

  if (qErr || !quest) throw new Error('Quest not found');
  if (quest.status !== 'active') throw new Error(`Quest is already ${quest.status}`);

  const { data: rows, error: lbErr } = await supabase.rpc('quest_leaderboard', {
    quest_start: quest.starts_at,
    quest_end: quest.ends_at,
  });

  if (lbErr || !rows?.length) throw new Error('No leaderboard data for this quest');

  const topN = quest.top_n ?? 3;
  const winners = rows.slice(0, topN);
  const totalScore = winners.reduce((s: number, r: any) => s + Number(r.total_score), 0);

  if (totalScore === 0) throw new Error('Total score is 0');

  // prize_pool is stored in tinybars (1 HBAR = 100_000_000 tinybars)
  const prizePoolTinybars = quest.prize_pool;
  const payouts: Payout[] = winners.map((w: any) => ({
    wallet: w.wallet_address as string,
    hbar: Math.floor((Number(w.total_score) / totalScore) * prizePoolTinybars),
  }));

  const distributed = payouts.reduce((s, p) => s + p.hbar, 0);
  if (distributed < prizePoolTinybars) payouts[0].hbar += prizePoolTinybars - distributed;

  // Build HBAR transfer from operator to each winner
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const transfer = new TransferTransaction();
  let totalOut = 0;

  for (const p of payouts) {
    if (p.hbar <= 0) continue;
    const recipientId = AccountId.fromEvmAddress(0, 0, p.wallet);
    transfer.addHbarTransfer(recipientId, Hbar.fromTinybars(p.hbar));
    totalOut += p.hbar;
  }
  transfer.addHbarTransfer(operatorId, Hbar.fromTinybars(-totalOut));

  // Wrap in ScheduleCreateTransaction — 30 min audit window before on-chain execution
  const expirationSeconds = Math.floor(Date.now() / 1000) + 30 * 60;

  const scheduleTx = new ScheduleCreateTransaction()
    .setScheduledTransaction(transfer)
    .setScheduleMemo(`BirdQuest prize payout – quest ${quest.id}`)
    .setWaitForExpiry(true)
    .setExpirationTime(new Timestamp(expirationSeconds, 0))
    .setPayerAccountId(operatorId);

  const txResponse = await scheduleTx.execute(hederaClient);
  const receipt = await txResponse.getReceipt(hederaClient);
  const scheduleId = receipt.scheduleId!.toString();

  await supabase
    .from('quests')
    .update({ status: 'distributing', schedule_id: scheduleId })
    .eq('id', quest.id);

  return {
    questId: quest.id,
    scheduleId,
    expiresAt: new Date(expirationSeconds * 1000).toISOString(),
    payouts,
    hashscanUrl: `https://hashscan.io/testnet/schedule/${scheduleId}`,
  };
}
