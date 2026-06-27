<script>
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import { pageTitle, siteMeta } from '$lib/config/site.js';
  import { createRoom } from '$lib/utils/api.js';
  import { initSound, playSound, soundMuted, toggleSound } from '$lib/utils/sound.js';
  import { applyTheme } from '$lib/utils/theme.js';

  export let data;

  let name = '';
  let selectedCategories = data.categories.slice(0, 3);
  let questionCount = 8;
  let timePerQuestion = 30;
  let bonusTimer = true;
  let chillMode = false;
  let selectedTheme = data.themes[0]?.id || 'neon';
  let customJson = '';
  let customCount = 0;
  let error = '';
  let jsonError = '';
  let creating = false;
  const jsonPlaceholder =
    '[{"text":"Question ?","answers":["A","B"],"correctIndex":0,"category":"perso","image":"https://..."}]';
  const title = pageTitle('Créer un quiz multijoueur');
  const description = siteMeta.description;

  onMount(() => {
    initSound();
    chillMode = localStorage.getItem('quizz-chill') === 'true';
    selectedTheme = localStorage.getItem('quizz-theme') || selectedTheme;
    applyChillClass();
    applyTheme(selectedTheme);
  });

  function applyChillClass() {
    document.documentElement.classList.toggle('chill', chillMode);
  }

  function setChillMode(value) {
    chillMode = value;
    localStorage.setItem('quizz-chill', value ? 'true' : 'false');
    applyChillClass();
  }

  function setTheme(themeId) {
    selectedTheme = themeId;
    localStorage.setItem('quizz-theme', themeId);
    applyTheme(themeId);
    playSound('ui');
  }

  function parseCustomQuestions() {
    jsonError = '';
    customCount = 0;
    if (!customJson.trim()) return [];

    try {
      const parsed = JSON.parse(customJson);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(questions)) throw new Error('Format JSON non reconnu.');

      const valid = questions.filter((question) => {
        const answers = question.answers || question.choices;
        const correctIndex = Number(question.correctIndex ?? question.correct ?? question.answerIndex);
        return question.text && Array.isArray(answers) && answers.length >= 2 && Number.isInteger(correctIndex);
      });

      customCount = valid.length;
      if (!valid.length) throw new Error('Aucune question valide.');
      return valid;
    } catch (err) {
      jsonError = err.message || 'JSON invalide.';
      return null;
    }
  }

  function previewJson() {
    parseCustomQuestions();
  }

  async function submit() {
    error = '';
    const customQuestions = parseCustomQuestions();
    if (customQuestions === null) return;
    if (!selectedCategories.length && !customQuestions.length) {
      error = 'Sélectionne une catégorie ou ajoute un JSON valide.';
      return;
    }

    creating = true;
    playSound('start');
    try {
      const { room } = await createRoom({
        name,
        categories: selectedCategories,
        questionCount,
        timePerQuestion,
        bonusTimer,
        themeId: selectedTheme,
        customQuestions
      });
      location.href = `/room/${room.id}`;
    } catch (err) {
      console.error('Création du salon impossible', err);
      error = 'Impossible de créer le salon pour le moment.';
      creating = false;
    }
  }

  function toggleCategory(category) {
    selectedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];
    playSound('ui');
  }
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={siteMeta.keywords} />
  <meta name="robots" content="index,follow" />
  <meta property="og:site_name" content={siteMeta.name} />
  <meta property="og:locale" content={siteMeta.locale} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
</svelte:head>

<main class="page">
  <section class="shell home">
    <div class="brand-panel">
      <p class="mono kicker">QUIZZ LAND</p>
      <h1>Des salons quiz rapides, conviviaux, sans compte.</h1>
      <div class="live-board" aria-hidden="true">
        <div class="orbital">
          <span>Q</span>
          <span>Z</span>
          <span>!</span>
        </div>
        <div class="preview-question">
          <span class="mono">Manche 03</span>
          <strong>Qui prend la tête ?</strong>
          <div class="bars">
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
      </div>
      <div class="stats">
        <span><b>{data.categories.length}</b> catégories</span>
        <span><b>{data.themes.length}</b> thèmes</span>
        <span><b>{customCount}</b> perso</span>
      </div>
    </div>

    <form class="card creator" on:submit|preventDefault={submit} aria-describedby="creator-status">
      <div class="form-head">
        <div>
          <p class="mono">Nouveau salon</p>
          <h2>Réglages</h2>
        </div>
        <button
          type="button"
          class="sound-toggle"
          on:click={toggleSound}
          aria-label={$soundMuted ? 'Activer le son' : 'Couper le son'}
          aria-pressed={!$soundMuted}
        >
          {$soundMuted ? 'Son coupé' : 'Son activé'}
        </button>
      </div>

      <label class="field">
        <span>Nom du salon</span>
        <input bind:value={name} maxlength="36" placeholder="Soirée quiz" autocomplete="off" />
      </label>

      <fieldset>
        <legend>Thème visuel</legend>
        <div class="themes">
          {#each data.themes as theme}
            <button
              type="button"
              class:active={selectedTheme === theme.id}
              class={`swatch theme-${theme.id}`}
              on:click={() => setTheme(theme.id)}
              aria-pressed={selectedTheme === theme.id}
            >
              <span></span>
              {theme.name}
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset>
        <legend>Catégories</legend>
        <div class="chips">
          {#each data.categories as category}
            <button
              type="button"
              class:active={selectedCategories.includes(category)}
              on:click={() => toggleCategory(category)}
              aria-pressed={selectedCategories.includes(category)}
            >
              {category}
            </button>
          {/each}
        </div>
      </fieldset>

      <div class="sliders">
        <label class="field">
          <span>Questions <b class="mono">{questionCount}</b></span>
          <input type="range" min="5" max="50" bind:value={questionCount} />
        </label>

        <label class="field">
          <span>Temps par question <b class="mono">{timePerQuestion}s</b></span>
          <input type="range" min="10" max="120" step="5" bind:value={timePerQuestion} />
        </label>
      </div>

      <div class="toggles">
        <label class="toggle">
          <input type="checkbox" bind:checked={bonusTimer} />
          <span>Bonus temps</span>
        </label>

        <label class="toggle">
          <input type="checkbox" checked={chillMode} on:change={(e) => setChillMode(e.currentTarget.checked)} />
          <span>Mode chill</span>
        </label>
      </div>

      <label class="field json-field">
        <span>Questions JSON temporaires</span>
        <textarea
          aria-describedby="creator-status"
          bind:value={customJson}
          on:input={previewJson}
          spellcheck="false"
          placeholder={jsonPlaceholder}
        ></textarea>
      </label>

      <div id="creator-status" class:bad={jsonError} class="json-status" role="status" aria-live="polite">
        <span class="mono">{jsonError || `${customCount} question(s) perso prêtes`}</span>
      </div>

      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <Button type="submit" disabled={creating}>
        {creating ? 'Création…' : 'Créer le salon'}
      </Button>
    </form>
  </section>
</main>

<style>
  .home {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(340px, 480px);
    gap: 32px;
    align-items: center;
    min-height: calc(100vh - 64px);
  }

  .brand-panel {
    display: grid;
    gap: 24px;
  }

  .kicker,
  .form-head p {
    margin: 0;
    color: var(--color-accent);
    font-weight: 900;
  }

  h1,
  h2 {
    margin: 0;
  }

  h1 {
    max-width: 680px;
    font-size: 4rem;
  }

  h2 {
    font-size: 2rem;
  }

  .live-board {
    position: relative;
    display: grid;
    min-height: 260px;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-panel);
    background:
      linear-gradient(135deg, rgba(255, 79, 121, 0.18), transparent 38%),
      linear-gradient(315deg, rgba(2, 166, 166, 0.18), transparent 42%),
      rgba(255, 255, 255, 0.62);
    box-shadow: var(--shadow-card);
  }

  .orbital {
    position: absolute;
    inset: 18px;
  }

  .orbital span {
    position: absolute;
    display: grid;
    width: 52px;
    aspect-ratio: 1;
    place-items: center;
    border-radius: 999px;
    background: var(--color-ink);
    color: white;
    font-weight: 900;
    box-shadow: var(--shadow-soft);
    animation: rise-in 360ms var(--ease-pop) both;
  }

  .orbital span:nth-child(1) {
    top: 12%;
    left: 12%;
    background: var(--color-accent);
  }

  .orbital span:nth-child(2) {
    right: 14%;
    top: 18%;
    background: var(--color-cyan);
  }

  .orbital span:nth-child(3) {
    right: 22%;
    bottom: 12%;
    background: var(--color-yellow);
    color: var(--color-ink);
  }

  .preview-question {
    position: relative;
    display: grid;
    width: min(360px, calc(100% - 44px));
    gap: 14px;
    border: 1px solid var(--border-soft);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.84);
    padding: 22px;
    box-shadow: var(--shadow-card);
  }

  .preview-question > span {
    color: var(--color-accent);
    font-weight: 900;
  }

  .preview-question strong {
    font-size: 1.45rem;
  }

  .bars {
    display: grid;
    gap: 8px;
  }

  .bars i {
    display: block;
    height: 12px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--color-accent), var(--color-yellow));
  }

  .bars i:nth-child(2) {
    width: 74%;
    background: linear-gradient(90deg, var(--color-cyan), var(--color-blue));
  }

  .bars i:nth-child(3) {
    width: 46%;
    background: linear-gradient(90deg, var(--color-lilac), var(--color-accent));
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .stats span {
    display: inline-flex;
    min-height: 38px;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.70);
    padding: 0 14px;
    color: var(--color-muted);
    font-weight: 800;
  }

  .stats b {
    color: var(--color-ink);
  }

  .creator {
    display: grid;
    gap: 18px;
    padding: 24px;
  }

  .form-head {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 16px;
  }

  .sound-toggle {
    min-height: 38px;
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    background: white;
    color: var(--color-ink);
    padding: 0 12px;
    font-weight: 900;
  }

  fieldset {
    min-width: 0;
    border: 0;
    margin: 0;
    padding: 0;
  }

  legend {
    margin-bottom: 8px;
    color: var(--color-muted);
    font-size: 14px;
    font-weight: 800;
  }

  .chips,
  .themes,
  .toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chips button,
  .themes button {
    min-height: 42px;
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    background: white;
    color: var(--color-ink);
    padding: 0 14px;
    font-weight: 900;
    transition:
      transform var(--duration-fast) var(--ease-pop),
      border-color var(--duration-fast) ease,
      background var(--duration-fast) ease;
  }

  .chips button:hover,
  .themes button:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 79, 121, 0.42);
  }

  .chips .active,
  .themes .active {
    border-color: transparent;
    background: var(--color-ink);
    color: white;
  }

  .swatch {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .swatch span {
    width: 18px;
    aspect-ratio: 1;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--color-accent), var(--color-cyan));
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.65);
  }

  .sliders {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    padding: 0 14px;
    font-weight: 900;
  }

  .json-field textarea {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }

  .json-status {
    display: inline-flex;
    justify-self: start;
    min-height: 32px;
    align-items: center;
    border-radius: 999px;
    background: rgba(18, 130, 92, 0.10);
    color: var(--color-success);
    padding: 0 12px;
    font-size: 12px;
    font-weight: 900;
  }

  .json-status.bad {
    background: rgba(217, 45, 85, 0.10);
    color: var(--color-danger);
  }

  .error {
    margin: 0;
    color: var(--color-danger);
    font-weight: 900;
  }

  @media (max-width: 880px) {
    .home {
      grid-template-columns: 1fr;
      align-items: start;
    }

    h1 {
      font-size: 3rem;
    }
  }

  @media (max-width: 560px) {
    h1 {
      font-size: 2.35rem;
    }

    .creator {
      padding: 18px;
    }

    .form-head,
    .sliders {
      grid-template-columns: 1fr;
      display: grid;
    }

    .sound-toggle {
      width: 100%;
    }
  }
</style>
