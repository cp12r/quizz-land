import { json } from '@sveltejs/kit';
import { s as submitAnswer } from './roomManager-BJwjArDt.js';
import { r as rateLimit } from './rateLimit-CsW6Nn7k.js';
import 'node:fs/promises';
import 'node:path';
import 'node:url';
import './questions-036w9Ron.js';

async function POST({ params, request }) {
  const body = await request.json();
  if (!rateLimit(`answer:${params.roomId}:${body.playerId}`, 60)) {
    return json({ message: "Trop de reponses." }, { status: 429 });
  }
  const room = await submitAnswer(params.roomId, body.playerId, body.answerIndex);
  if (!room) return json({ message: "Action impossible." }, { status: 400 });
  return json({ room });
}

export { POST };
//# sourceMappingURL=_server-Dk0B-Whm.js.map
