import { f as fallback, d as attr_class, a as attr, s as slot, b as bind_props } from './index.js-Cmi5Zerj.js';

function Button($$renderer, $$props) {
  let href = fallback($$props["href"], null);
  let variant = fallback($$props["variant"], "primary");
  let type = fallback($$props["type"], "button");
  let disabled = fallback($$props["disabled"], false);
  let onclick = fallback($$props["onclick"], void 0);
  if (href) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<a${attr_class("button svelte-18sv61c", void 0, {
      "secondary": variant === "secondary",
      "ghost": variant === "ghost"
    })}${attr("href", href)}><!--[-->`);
    slot($$renderer, $$props, "default", {});
    $$renderer.push(`<!--]--></a>`);
  } else {
    $$renderer.push("<!--[-1-->");
    $$renderer.push(`<button${attr_class("button svelte-18sv61c", void 0, {
      "secondary": variant === "secondary",
      "ghost": variant === "ghost"
    })}${attr("type", type)}${attr("disabled", disabled, true)}><!--[-->`);
    slot($$renderer, $$props, "default", {});
    $$renderer.push(`<!--]--></button>`);
  }
  $$renderer.push(`<!--]-->`);
  bind_props($$props, { href, variant, type, disabled, onclick });
}

export { Button as B };
//# sourceMappingURL=Button-l2OeQGM_.js.map
