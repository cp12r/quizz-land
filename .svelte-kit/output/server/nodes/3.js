import * as server from '../entries/pages/results/_roomId_/_page.server.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/results/_roomId_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/results/[roomId]/+page.server.js";
export const imports = ["_app/immutable/nodes/3.B0idhhio.js","_app/immutable/chunks/BXPYkUlt.js","_app/immutable/chunks/DW_Ws3l1.js","_app/immutable/chunks/C2XoJK5I.js","_app/immutable/chunks/CUwBtlX_.js","_app/immutable/chunks/hCjN1l5-.js","_app/immutable/chunks/Bl4AFKHY.js"];
export const stylesheets = ["_app/immutable/assets/Button.BuhIgks9.css","_app/immutable/assets/3.xUTVO4Kz.css"];
export const fonts = [];
