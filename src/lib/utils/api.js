export async function createRoom(config) {
  const response = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) throw new Error((await response.json()).message);
  return response.json();
}
