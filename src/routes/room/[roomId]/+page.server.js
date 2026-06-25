import { error } from '@sveltejs/kit';
import { getRoom } from '$server/services/roomManager.js';

export async function load({ params }) {
  const room = await getRoom(params.roomId);
  if (!room) throw error(404, 'Room introuvable');
  return { room };
}
