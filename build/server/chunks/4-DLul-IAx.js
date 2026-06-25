import { error } from '@sveltejs/kit';
import { g as getRoom } from './roomManager-BJwjArDt.js';
import 'node:fs/promises';
import 'node:path';
import 'node:url';
import './questions-036w9Ron.js';

async function load({ params }) {
  const room = await getRoom(params.roomId);
  if (!room) throw error(404, "Room introuvable");
  return { room };
}

var _page_server = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 4;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-Bg7QHcgT.js')).default;
const server_id = "src/routes/room/[roomId]/+page.server.js";
const imports = ["_app/immutable/nodes/4.Dxck09AM.js","_app/immutable/chunks/BXPYkUlt.js","_app/immutable/chunks/DW_Ws3l1.js","_app/immutable/chunks/C2XoJK5I.js","_app/immutable/chunks/kVSp5a6I.js","_app/immutable/chunks/CUwBtlX_.js","_app/immutable/chunks/Bl4AFKHY.js","_app/immutable/chunks/CuxJchxv.js","_app/immutable/chunks/hCjN1l5-.js"];
const stylesheets = ["_app/immutable/assets/Button.BuhIgks9.css","_app/immutable/assets/4.PFeqW09L.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server as server, server_id, stylesheets };
//# sourceMappingURL=4-DLul-IAx.js.map
