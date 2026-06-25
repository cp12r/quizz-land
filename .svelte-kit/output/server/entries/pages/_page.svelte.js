import { a5 as attr, a6 as ensure_array_like, a7 as attr_class, a2 as escape_html, a3 as bind_props } from "../../chunks/index.js";
import { B as Button } from "../../chunks/Button.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let name = "";
    let selectedCategories = data.categories.slice(0, 3);
    let questionCount = 8;
    let timePerQuestion = 30;
    let bonusTimer = true;
    $$renderer2.push(`<main class="page"><section class="shell home svelte-1uha8ag"><div class="intro svelte-1uha8ag"><p class="mono svelte-1uha8ag">QUIZZ LAND</p> <h1 class="svelte-1uha8ag">Cree une room, invite tes amis, lance la partie.</h1></div> <form class="card creator svelte-1uha8ag"><label class="field"><span>Nom de la room</span> <input${attr("value", name)} maxlength="36" placeholder="Auto si vide"/></label> <fieldset class="svelte-1uha8ag"><legend class="svelte-1uha8ag">Categories</legend> <div class="chips svelte-1uha8ag"><!--[-->`);
    const each_array = ensure_array_like(data.categories);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let category = each_array[$$index];
      $$renderer2.push(`<button type="button"${attr_class("svelte-1uha8ag", void 0, { "active": selectedCategories.includes(category) })}>${escape_html(category)}</button>`);
    }
    $$renderer2.push(`<!--]--></div></fieldset> <label class="field"><span>Nombre de questions: <b class="mono">${escape_html(questionCount)}</b></span> <input type="range" min="5" max="50"${attr("value", questionCount)}/></label> <label class="field"><span>Temps par question: <b class="mono">${escape_html(timePerQuestion)}s</b></span> <input type="range" min="10" max="120" step="5"${attr("value", timePerQuestion)}/></label> <label class="toggle svelte-1uha8ag"><input type="checkbox"${attr("checked", bonusTimer, true)}/> Bonus temps</label> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    Button($$renderer2, {
      type: "submit",
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->Creer la room`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></form></section></main>`);
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
