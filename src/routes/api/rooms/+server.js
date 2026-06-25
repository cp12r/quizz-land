import { json } from '@sveltejs/kit';
import { createRoom } from '$server/services/roomManager.js';
import { rateLimit } from '$server/services/rateLimit.js';

export async function POST({ request, getClientAddress }) {
  if (!rateLimit(`create:${getClientAddress()}`, 10)) {
    return json({ message: 'Trop de creations de rooms. Reessaie dans une minute.' }, { status: 429 });
  }
  const config = await request.json();
  const room = await createRoom(config);
  return json({ room });
}
