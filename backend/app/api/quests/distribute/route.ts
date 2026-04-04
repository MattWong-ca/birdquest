import { distributeQuest } from '../../../lib/distribute';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: Request) {
  let body: { quest_id: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  if (!body.quest_id) {
    return Response.json({ error: 'Missing quest_id' }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const result = await distributeQuest(body.quest_id);
    return Response.json(result, { headers: CORS_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Distribution failed';
    return Response.json({ error: message }, { status: 400, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}
