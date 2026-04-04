import { createClient } from '@supabase/supabase-js';
import { distributeQuest } from '../../../lib/distribute';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  // Verify the request comes from Vercel Cron (not a random caller)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  const { data: expiredQuests, error } = await supabase
    .from('quests')
    .select('id')
    .eq('status', 'active')
    .lt('ends_at', now);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!expiredQuests?.length) {
    return Response.json({ message: 'No expired quests to process' });
  }

  const results = await Promise.allSettled(
    expiredQuests.map((q) => distributeQuest(q.id))
  );

  const summary = results.map((r, i) => ({
    questId: expiredQuests[i].id,
    status: r.status,
    ...(r.status === 'fulfilled'
      ? { scheduleId: r.value.scheduleId, hashscanUrl: r.value.hashscanUrl }
      : { error: r.reason?.message }),
  }));

  return Response.json({ processed: summary });
}
