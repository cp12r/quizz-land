import { e as escape_html, a as attr, b as bind_props } from './index.js-Cmi5Zerj.js';
import { B as Button } from './Button-l2OeQGM_.js';
import '@sveltejs/kit';
import '@sveltejs/kit/internal';
import '@sveltejs/kit/internal/server';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let shareUrl;
    let data = $$props["data"];
    let room = data.room;
    let playerName = "";
    room.config.timePerQuestion;
    async function copyLink() {
      await navigator.clipboard.writeText(shareUrl);
    }
    room.status === "playing" ? room.questions[room.currentQuestion] : null;
    shareUrl = typeof location === "undefined" ? "" : `${location.origin}/room/${room.id}`;
    $$renderer2.push(`<main class="page"><section class="shell room svelte-gjovul"><header class="top svelte-gjovul"><div><p class="mono svelte-gjovul">${escape_html(room.id)}</p> <h1 class="svelte-gjovul">${escape_html(room.name)}</h1></div> `);
    Button($$renderer2, {
      variant: "secondary",
      onclick: copyLink,
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->Copier le lien`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></header> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<form class="card join svelte-gjovul"><label class="field"><span>Pseudo</span> <input${attr("value", playerName)} maxlength="24" placeholder="Ton nom"/></label> `);
      Button($$renderer2, {
        type: "submit",
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Rejoindre`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></form>`);
    }
    $$renderer2.push(`<!--]--></section></main>`);
    bind_props($$props, { data });
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Bg7QHcgT.js.map
