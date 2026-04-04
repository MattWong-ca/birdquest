import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  // Fetch the currently active quest (or the most recently ended one)
  const now = new Date().toISOString();
  const { data: quest, error: questError } = await supabase
    .from('quests')
    .select('*')
    .or(`status.eq.active,status.eq.distributing`)
    .order('ends_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (questError) {
    return Response.json({ error: questError.message }, { status: 500, headers: CORS_HEADERS });
  }

  if (!quest) {
    return Response.json({ quest: null, leaderboard: [], userRank: null }, { headers: CORS_HEADERS });
  }

  // Aggregate trip scores per user during the quest window
  const { data: rows, error: lbError } = await supabase
    .rpc('quest_leaderboard', {
      quest_start: quest.starts_at,
      quest_end: quest.ends_at,
    });

  if (lbError) {
    return Response.json({ error: lbError.message }, { status: 500, headers: CORS_HEADERS });
  }

  const leaderboard = (rows ?? []).map((r: any, i: number) => ({
    rank: i + 1,
    wallet_address: r.wallet_address,
    username: r.username,
    total_score: Number(r.total_score),
  }));

  let userRank: number | null = null;
  if (wallet) {
    const idx = leaderboard.findIndex(
      (e: any) => e.wallet_address.toLowerCase() === wallet.toLowerCase()
    );
    if (idx !== -1) userRank = idx + 1;
  }

  return Response.json(
    {
      quest: {
        id: quest.id,
        sponsor_name: quest.sponsor_name,
        sponsor_logo: quest.sponsor_logo,
        prize_pool: quest.prize_pool,
        starts_at: quest.starts_at,
        ends_at: quest.ends_at,
        status: quest.status,
        schedule_id: quest.schedule_id,
        top_n: quest.top_n,
      },
      leaderboard,
      userRank,
    },
    { headers: CORS_HEADERS }
  );
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}
