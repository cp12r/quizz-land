import { json } from '@sveltejs/kit';
import { j as joinRoom } from './roomManager-BJwjArDt.js';
import { r as rateLimit } from './rateLimit-CsW6Nn7k.js';
import 'node:fs/promises';
import 'node:path';
import 'node:url';
import './questions-036w9Ron.js';

async function POST({ params, request, getClientAddress }) {
  if (!rateLimit(`join:${params.roomId}:${getClientAddress()}`, 20)) {
    return json({ message: "Trop de tentatives." }, { status: 429 });
  }
  const body = await request.json();
  const joined = await joinRoom(params.roomId, body.name, body.playerId);
  if (!joined) return json({ message: "Room introuvable." }, { status: 404 });
  return json(joined);
}

export { POST };
//# sourceMappingURL=_server-Dp7popZN.js.map
