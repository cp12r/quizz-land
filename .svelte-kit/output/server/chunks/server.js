const browser = false;
let prerendering = false;
function set_building() {
}
function set_prerendering() {
  prerendering = true;
}
let base = "";
let assets = base;
const app_dir = "_app";
const relative = true;
const initial = { base, assets };
function override(paths) {
  base = paths.base;
  assets = paths.assets;
}
function reset() {
  base = initial.base;
  assets = initial.assets;
}
function set_assets(path) {
  assets = initial.assets = path;
}
export {
  app_dir as a,
  base as b,
  browser as c,
  assets as d,
  reset as e,
  set_building as f,
  set_prerendering as g,
  override as o,
  prerendering as p,
  relative as r,
  set_assets as s
};
