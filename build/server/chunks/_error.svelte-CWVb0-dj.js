import { e as escape_html, b as bind_props } from './index.js-Cmi5Zerj.js';
import { B as Button } from './Button-l2OeQGM_.js';
import '@sveltejs/kit';
import '@sveltejs/kit/internal';
import '@sveltejs/kit/internal/server';

function _error($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let status = $$props["status"];
    let error = $$props["error"];
    $$renderer2.push(`<main class="page error-page svelte-1j96wlh"><section class="shell card panel svelte-1j96wlh"><p class="mono">${escape_html(status)}</p> <h1>${escape_html(error?.message || "Page introuvable")}</h1> `);
    Button($$renderer2, {
      href: "/",
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->Retour accueil`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></section></main>`);
    bind_props($$props, { status, error });
  });
}

export { _error as default };
//# sourceMappingURL=_error.svelte-CWVb0-dj.js.map
