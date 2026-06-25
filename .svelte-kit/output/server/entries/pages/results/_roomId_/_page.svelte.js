import { a2 as escape_html, a6 as ensure_array_like, a7 as attr_class, a3 as bind_props } from "../../../../chunks/index.js";
import { B as Button } from "../../../../chunks/Button.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let exportText;
    let data = $$props["data"];
    async function copyResults() {
      await navigator.clipboard.writeText(exportText);
    }
    exportText = JSON.stringify({ room: data.room.id, results: data.results }, null, 2);
    $$renderer2.push(`<main class="page"><section class="shell results svelte-1wknh6y"><header class="svelte-1wknh6y"><p class="mono svelte-1wknh6y">${escape_html(data.room.id)}</p> <h1 class="svelte-1wknh6y">Classement final</h1></header> <section class="card board svelte-1wknh6y"><!--[-->`);
    const each_array = ensure_array_like(data.results);
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let player = each_array[index];
      $$renderer2.push(`<article${attr_class("svelte-1wknh6y", void 0, { "podium": index < 3 })}><span class="rank mono svelte-1wknh6y">${escape_html(index + 1)}</span> <strong>${escape_html(player.name)}</strong> <span class="mono">${escape_html(player.score)} pts</span></article>`);
    }
    $$renderer2.push(`<!--]--></section> <div class="actions svelte-1wknh6y">`);
    Button($$renderer2, {
      href: "/",
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->Nouvelle room`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> `);
    Button($$renderer2, {
      variant: "secondary",
      onclick: copyResults,
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->Exporter JSON`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div></section></main>`);
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
