import { getResultSnapshot, getResults, getRoom } from '$server/services/roomManager.js';
import { ogSvg, svgResponse } from '$server/services/ogImage.js';
import { resultsMeta, siteMeta } from '$lib/config/site.js';

export async function GET({ params }) {
  const room = await getRoom(params.roomId, true);
  const snapshot = room ? null : await getResultSnapshot(params.roomId);
  const safeRoom = room || snapshot?.room;
  const results = room ? getResults(room) : snapshot?.results || [];
  const winner = results[0];
  const meta = safeRoom ? resultsMeta(safeRoom, results) : null;

  return svgResponse(
    ogSvg({
      eyebrow: 'Classement final',
      title: winner ? `${winner.name} gagne` : 'Résultats quiz',
      description: meta?.description || siteMeta.description,
      footer: winner ? `${winner.score} points` : 'Quizz Land'
    })
  );
}
