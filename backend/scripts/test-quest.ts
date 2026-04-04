/**
 * Quick test: creates a quest that expires in 15 minutes.
 *
 * Usage:
 *   npx tsx scripts/test-quest.ts
 *
 * After running, log a trip in the app within 15 min so there's leaderboard
 * data. Once the quest expires the cron (or a manual POST to /api/quests/distribute)
 * will create the Hedera Scheduled Transaction and you can watch it on Hashscan.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const now = new Date();
  const endsAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 min from now

  // Prize pool: 10 HBAR in tinybars
  const prizePoolTinybars = 10 * 100_000_000;

  const { data, error } = await supabase
    .from('quests')
    .insert({
      sponsor_name: 'Test Sponsor',
      prize_pool: prizePoolTinybars,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      top_n: 3,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create quest:', error.message);
    process.exit(1);
  }

  console.log('Test quest created!');
  console.log(`  ID:       ${data.id}`);
  console.log(`  Prize:    10 HBAR`);
  console.log(`  Starts:   ${now.toISOString()}`);
  console.log(`  Expires:  ${endsAt.toISOString()}`);
  console.log(`  Top N:    3`);
  console.log('');
  console.log('Now log a trip in the app. After 15 min the cron will pick it up,');
  console.log('or trigger manually:');
  console.log(`  curl -X POST http://localhost:3000/api/quests/distribute \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"quest_id":"${data.id}"}'`);
}

main();
