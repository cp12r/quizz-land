import { json } from '@sveltejs/kit';
import { joinRoom } from '$server/services/roomManager.js';
import { rateLimit } from '$server/services/rateLimit.js';

export async function POST({ params, request, getClientAddress }) {
  if (!rateLimit(`join:${params.roomId}:${getClientAddress()}`, 20)) {
    return json({ message: 'Trop de tentatives.' }, { status: 429 });
  }
  const body = await request.json();
  const joined = await joinRoom(params.roomId, body.name, body.playerId);
  if (!joined) return json({ message: 'Room introuvable.' }, { status: 404 });
  return json(joined);
}
