import { error } from '@sveltejs/kit';
import { g as getRoom, a as getResults } from './roomManager-BJwjArDt.js';
import 'node:fs/promises';
import 'node:path';
import 'node:url';
import './questions-036w9Ron.js';

async function load({ params }) {
  const room = await getRoom(params.roomId, true);
  if (!room) throw error(404, "Resultats introuvables");
  return { room: { ...room, questions: void 0 }, results: getResults(room) };
}

var _page_server = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 3;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BMOr2Zv-.js')).default;
const server_id = "src/routes/results/[roomId]/+page.server.js";
const imports = ["_app/immutable/nodes/3.B0idhhio.js","_app/immutable/chunks/BXPYkUlt.js","_app/immutable/chunks/DW_Ws3l1.js","_app/immutable/chunks/C2XoJK5I.js","_app/immutable/chunks/CUwBtlX_.js","_app/immutable/chunks/hCjN1l5-.js","_app/immutable/chunks/Bl4AFKHY.js"];
const stylesheets = ["_app/immutable/assets/Button.BuhIgks9.css","_app/immutable/assets/3.xUTVO4Kz.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server as server, server_id, stylesheets };
//# sourceMappingURL=3-Couwg4sv.js.map
