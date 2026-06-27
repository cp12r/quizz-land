import { json } from '@sveltejs/kit';
import { submitAnswer } from '$server/services/roomManager.js';
import { rateLimit } from '$server/services/rateLimit.js';
import { log } from '$server/services/logger.js';

export async function POST({ params, request }) {
  try {
    const body = await request.json();
    if (!rateLimit(`answer:${params.roomId}:${body.playerId}`, 60)) {
      return json({ message: 'Trop de réponses.' }, { status: 429 });
    }
    const result = await submitAnswer(params.roomId, body.playerId, body.answerIndex);
    if (!result) return json({ message: 'Action impossible.' }, { status: 400 });
    return json({ room: result.room, feedback: result.feedback });
  } catch (error) {
    log('error', 'submit_answer_failed', { roomId: params.roomId, error: error.message });
    return json({ message: 'Impossible de valider la réponse.' }, { status: 500 });
  }
}
