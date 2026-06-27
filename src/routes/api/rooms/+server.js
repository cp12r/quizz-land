import { json } from '@sveltejs/kit';
import { createRoom } from '$server/services/roomManager.js';
import { rateLimit } from '$server/services/rateLimit.js';
import { log } from '$server/services/logger.js';

export async function POST({ request, getClientAddress }) {
  try {
    if (!rateLimit(`create:${getClientAddress()}`, 10)) {
      return json({ message: 'Trop de créations de salons. Réessaie dans une minute.' }, { status: 429 });
    }
    const config = await request.json();
    const room = await createRoom(config);
    return json({ room });
  } catch (error) {
    log('error', 'create_room_failed', { error: error.message });
    return json({ message: 'Impossible de créer le salon.' }, { status: 500 });
  }
}
