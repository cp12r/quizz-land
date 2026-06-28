import { getResultSnapshot, getResults, getRoom } from '$server/services/roomManager.js';

export async function load({ params }) {
  const room = await getRoom(params.roomId, true);

  if (!room) {
    const snapshot = await getResultSnapshot(params.roomId);
    if (!snapshot) {
      return {
        missing: true,
        room: { id: params.roomId, config: {}, deleteAfter: null },
        results: []
      };
    }

    return {
      missing: false,
      room: { ...snapshot.room, questions: undefined, deleteAfter: snapshot.deleteAfter },
      results: snapshot.results
    };
  }

  return { missing: false, room: { ...room, questions: undefined }, results: getResults(room) };
}
