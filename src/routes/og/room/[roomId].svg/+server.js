import { getRoom } from '$server/services/roomManager.js';
import { ogSvg, svgResponse } from '$server/services/ogImage.js';
import { roomMeta, siteMeta } from '$lib/config/site.js';

export async function GET({ params }) {
  const room = await getRoom(params.roomId);
  const meta = room ? roomMeta(room) : null;
  const questionCount = room?.config?.questionCount || room?.questions?.length || 0;
  const status = room?.status === 'playing' ? 'Partie en cours' : room?.status === 'waiting' ? 'Salon ouvert' : 'Quizz Land';

  return svgResponse(
    ogSvg({
      eyebrow: status,
      title: room?.name || 'Salon quiz',
      description: meta?.description || siteMeta.description,
      footer: questionCount ? `${questionCount} questions` : 'quiz entre potes'
    })
  );
}
