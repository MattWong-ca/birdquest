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

export async function GET() {
  const { data, error } = await supabase
    .from('trips')
    .select('id, username, wallet_address, logged_at, start_lat, start_lon, total_birds, species_count, distance_meters, duration_seconds, score, birds')
    .order('logged_at', { ascending: false })
    .limit(200);

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }

  return Response.json({ trips: data ?? [] }, { headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
