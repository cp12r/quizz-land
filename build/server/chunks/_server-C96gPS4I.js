import { json } from '@sveltejs/kit';
import { c as createRoom } from './roomManager-BJwjArDt.js';
import { r as rateLimit } from './rateLimit-CsW6Nn7k.js';
import 'node:fs/promises';
import 'node:path';
import 'node:url';
import './questions-036w9Ron.js';

async function POST({ request, getClientAddress }) {
  if (!rateLimit(`create:${getClientAddress()}`, 10)) {
    return json({ message: "Trop de creations de rooms. Reessaie dans une minute." }, { status: 429 });
  }
  const config = await request.json();
  const room = await createRoom(config);
  return json({ room });
}

export { POST };
//# sourceMappingURL=_server-C96gPS4I.js.map
