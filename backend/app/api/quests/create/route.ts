import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface CreateQuestBody {
  sponsor_name: string;
  sponsor_logo?: string;
  prize_pool: number;
  starts_at: string;
  ends_at: string;
  top_n?: number;
}

export async function POST(request: Request) {
  let body: CreateQuestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  if (!body.sponsor_name || !body.prize_pool || !body.starts_at || !body.ends_at) {
    return Response.json(
      { error: 'Missing required fields: sponsor_name, prize_pool, starts_at, ends_at' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { data, error } = await supabase
    .from('quests')
    .insert({
      sponsor_name: body.sponsor_name,
      sponsor_logo: body.sponsor_logo ?? null,
      prize_pool: body.prize_pool,
      starts_at: body.starts_at,
      ends_at: body.ends_at,
      top_n: body.top_n ?? 3,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return Response.json({ questId: data.id }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}
