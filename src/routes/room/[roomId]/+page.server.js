import { error } from '@sveltejs/kit';
import { getRoom } from '$server/services/roomManager.js';
import { cleanCanonicalUrl } from '$lib/config/site.js';

export async function load({ params, url }) {
  const room = await getRoom(params.roomId);
  if (!room) throw error(404, 'Salon introuvable');
  return {
    room,
    origin: url.origin,
    canonicalUrl: cleanCanonicalUrl(url)
  };
}
