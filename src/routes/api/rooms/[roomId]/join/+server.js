import { json } from '@sveltejs/kit';
import { joinRoom } from '$server/services/roomManager.js';
import { rateLimit } from '$server/services/rateLimit.js';
import { log } from '$server/services/logger.js';

export async function POST({ params, request, getClientAddress }) {
  try {
    if (!rateLimit(`join:${params.roomId}:${getClientAddress()}`, 20)) {
      return json({ message: 'Trop de tentatives.' }, { status: 429 });
    }
    const body = await request.json();
    const joined = await joinRoom(params.roomId, body.name, body.playerId);
    if (!joined) return json({ message: 'Salon introuvable, complet ou déjà lancé.' }, { status: 404 });
    return json(joined);
  } catch (error) {
    log('error', 'join_room_failed', { roomId: params.roomId, error: error.message });
    return json({ message: 'Impossible de rejoindre le salon.' }, { status: 500 });
  }
}
