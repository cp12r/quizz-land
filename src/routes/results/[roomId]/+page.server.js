import { getResultSnapshot, getResults, getRoom } from '$server/services/roomManager.js';
import { cleanCanonicalUrl } from '$lib/config/site.js';

export async function load({ params, url }) {
  const room = await getRoom(params.roomId, true);

  if (!room) {
    const snapshot = await getResultSnapshot(params.roomId);
    if (!snapshot) {
      return {
        missing: true,
        origin: url.origin,
        canonicalUrl: cleanCanonicalUrl(url),
        room: { id: params.roomId, config: {}, deleteAfter: null },
        results: []
      };
    }

    return {
        missing: false,
        origin: url.origin,
        canonicalUrl: cleanCanonicalUrl(url),
        room: { ...snapshot.room, questions: undefined, deleteAfter: snapshot.deleteAfter },
        results: snapshot.results
      };
  }

  return {
    missing: false,
    origin: url.origin,
    canonicalUrl: cleanCanonicalUrl(url),
    room: { ...room, questions: undefined },
    results: getResults(room)
  };
}
