import { error } from '@sveltejs/kit';
import { getResultSnapshot, getResults, getRoom } from '$server/services/roomManager.js';

export async function load({ params }) {
  const room = await getRoom(params.roomId, true);

  if (!room) {
    const snapshot = await getResultSnapshot(params.roomId);
    if (!snapshot) throw error(404, 'Resultats introuvables');
    return {
      room: { ...snapshot.room, questions: undefined, deleteAfter: snapshot.deleteAfter },
      results: snapshot.results
    };
  }

  return { room: { ...room, questions: undefined }, results: getResults(room) };
}
