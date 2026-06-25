import * as server from '../entries/pages/_page.server.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.js";
export const imports = ["_app/immutable/nodes/2.D1J5qebC.js","_app/immutable/chunks/BXPYkUlt.js","_app/immutable/chunks/DW_Ws3l1.js","_app/immutable/chunks/C2XoJK5I.js","_app/immutable/chunks/CUwBtlX_.js","_app/immutable/chunks/hCjN1l5-.js","_app/immutable/chunks/Bl4AFKHY.js","_app/immutable/chunks/CuxJchxv.js"];
export const stylesheets = ["_app/immutable/assets/Button.BuhIgks9.css","_app/immutable/assets/2.B3tPViwx.css"];
export const fonts = [];
