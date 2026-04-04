export async function POST(request: Request) {
  const { birdName, scientificName, lat, lon, photoBase64 } = await request.json();

  const token = process.env.INATURALIST_TOKEN;
  if (!token) return Response.json({ error: 'Missing INATURALIST_TOKEN' }, { status: 500 });

  // Step 1: Create observation
  const obsRes = await fetch('https://api.inaturalist.org/v1/observations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      observation: {
        species_guess: birdName,
        taxon_name: scientificName,
        observed_on_string: new Date().toISOString().split('T')[0],
        latitude: lat,
        longitude: lon,
        description: 'Spotted in Cannes, France',
        place_guess: 'Cannes, France',
      },
    }),
  });

  if (!obsRes.ok) {
    const err = await obsRes.text();
    return Response.json({ error: `iNat observation failed: ${err}` }, { status: 502 });
  }

  const obsData = await obsRes.json();
  const observationId = Array.isArray(obsData) ? obsData[0]?.id : obsData?.id;
  if (!observationId) {
    return Response.json({ error: 'No observation ID returned' }, { status: 502 });
  }

  // Step 2: Attach photo
  if (photoBase64) {
    const buffer = Buffer.from(photoBase64, 'base64');
    const formData = new FormData();
    formData.append('observation_photo[observation_id]', String(observationId));
    formData.append('file', new Blob([buffer], { type: 'image/jpeg' }), 'photo.jpg');

    await fetch('https://api.inaturalist.org/v1/observation_photos', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
  }

  return Response.json(
    { observationId, url: `https://www.inaturalist.org/observations/${observationId}` },
    { headers: { 'Access-Control-Allow-Origin': '*' } },
  );
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
