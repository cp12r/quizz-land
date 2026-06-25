import { error } from '@sveltejs/kit';
import { getResults, getRoom } from '$server/services/roomManager.js';

export async function load({ params }) {
  const room = await getRoom(params.roomId, true);
  if (!room) throw error(404, 'Resultats introuvables');
  return { room: { ...room, questions: undefined }, results: getResults(room) };
}
