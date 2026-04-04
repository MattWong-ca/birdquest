import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return Response.json({ error: 'Missing wallet' }, { status: 400, headers: CORS });
  }

  const { data, error } = await supabase
    .from('trips')
    .select('birds')
    .eq('wallet_address', wallet);

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }

  // Collect unique bird names across all trips
  const seen = new Set<string>();
  for (const trip of data ?? []) {
    for (const b of trip.birds ?? []) {
      if (b.name) seen.add(b.name);
    }
  }

  return Response.json({ birds: Array.from(seen) }, { headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
