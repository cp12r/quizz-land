async function readResponse(response) {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return text ? JSON.parse(text) : {};
    } catch (error) {
      console.error('Invalid JSON response', { status: response.status, text, error });
      throw new Error('Le serveur a renvoye une reponse JSON invalide.');
    }
  }

  if (!response.ok) {
    console.error('Non JSON error response', { status: response.status, contentType, text });
    throw new Error(`Erreur serveur ${response.status}. Verifie que Render a bien deploye la derniere version.`);
  }

  console.error('Unexpected non JSON response', { status: response.status, contentType, text });
  throw new Error('Le serveur a renvoye une reponse inattendue.');
}

export async function createRoom(config) {
  const response = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(config)
  });
  const data = await readResponse(response);
  if (!response.ok) throw new Error(data.message || 'Impossible de creer la room.');
  return data;
}
