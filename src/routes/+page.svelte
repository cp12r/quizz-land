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

  $: selectedThemeName = data.themes.find((theme) => theme.id === selectedTheme)?.name || 'Thème';
  $: estimatedDuration = Math.max(1, Math.ceil((questionCount * timePerQuestion) / 60));
  $: categoryLabel = selectedCategories.length ? selectedCategories.join(' · ') : 'JSON uniquement';

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
    <div class="hero-panel">
      <div class="hero-copy">
        <p class="mono kicker">QUIZZ LAND</p>
        <h1>Crée un salon quiz en 30 secondes.</h1>
        <p class="lede">
          Une partie rapide à partager, sans compte, avec des questions prêtes ou ton propre JSON.
        </p>
      </div>

      <section class="game-preview" aria-label="Aperçu d’une partie Quizz Land">
        <div class="preview-top">
          <div>
            <span class="mono">Salon privé</span>
            <strong>{name.trim() || 'Soirée quiz'}</strong>
          </div>
          <span class="live-pill">En direct</span>
        </div>

        <div class="question-preview">
          <p class="mono">Manche 03 · {selectedThemeName}</p>
          <h2>Qui prend la tête avant le dernier reveal ?</h2>
          <div class="answer-grid" aria-hidden="true">
            <span class="selected">A · Paris</span>
            <span>B · Bruxelles</span>
            <span>C · Lyon</span>
            <span>D · Genève</span>
          </div>
        </div>

        <div class="preview-scoreboard" aria-hidden="true">
          <span class="mono">Classement</span>
          <div><b>1</b><strong>Camille</strong><em>420 pts</em></div>
          <div><b>2</b><strong>Sam</strong><em>390 pts</em></div>
          <div><b>3</b><strong>Alex</strong><em>310 pts</em></div>
        </div>
      </section>

      <div class="stats" aria-label="Résumé des réglages">
        <span><b>{questionCount}</b> questions</span>
        <span><b>{estimatedDuration}</b> min</span>
        <span><b>{customCount}</b> perso</span>
      </div>
    </div>

    <form class="creator" on:submit|preventDefault={submit} aria-describedby="creator-status">
      <div class="creator-header">
        <div>
          <p class="mono">Configuration</p>
          <h2>Prépare le salon</h2>
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

      <section class="settings-section">
        <div class="section-title">
          <span class="mono">01</span>
          <h3>Identité</h3>
        </div>
        <label class="field">
          <span>Nom du salon</span>
          <input bind:value={name} maxlength="36" placeholder="Soirée quiz" autocomplete="off" />
        </label>
      </section>

      <section class="settings-section">
        <div class="section-title">
          <span class="mono">02</span>
          <h3>Ambiance</h3>
        </div>
        <fieldset>
          <legend class="sr-only">Thème visuel</legend>
          <div class="option-grid themes">
            {#each data.themes as theme}
              <button
                type="button"
                class:active={selectedTheme === theme.id}
                class={`swatch theme-${theme.id}`}
                on:click={() => setTheme(theme.id)}
                aria-pressed={selectedTheme === theme.id}
              >
                <span></span>
                <strong>{theme.name}</strong>
              </button>
            {/each}
          </div>
        </fieldset>
      </section>

      <section class="settings-section">
        <div class="section-title">
          <span class="mono">03</span>
          <h3>Questions</h3>
          <small>{categoryLabel}</small>
        </div>
        <fieldset>
          <legend class="sr-only">Catégories</legend>
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
      </section>

      <section class="settings-section">
        <div class="section-title">
          <span class="mono">04</span>
          <h3>Rythme</h3>
        </div>
        <div class="sliders">
          <label class="range-field">
            <span>Questions</span>
            <strong class="mono">{questionCount}</strong>
            <input type="range" min="5" max="50" bind:value={questionCount} aria-label="Nombre de questions" />
          </label>

          <label class="range-field">
            <span>Temps</span>
            <strong class="mono">{timePerQuestion}s</strong>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              bind:value={timePerQuestion}
              aria-label="Temps par question"
            />
          </label>
        </div>

        <div class="toggles">
          <label class="toggle">
            <input type="checkbox" bind:checked={bonusTimer} />
            <span>Bonus temps</span>
          </label>

          <label class="toggle">
            <input type="checkbox" checked={chillMode} on:change={(e) => setChillMode(e.currentTarget.checked)} />
            <span>Mode calme</span>
          </label>
        </div>
      </section>

      <section class="settings-section json-section">
        <div class="section-title">
          <span class="mono">05</span>
          <h3>Import JSON</h3>
          <small>Optionnel</small>
        </div>
        <label class="field json-field">
          <span>Questions temporaires</span>
          <textarea
            aria-describedby="creator-status json-help"
            bind:value={customJson}
            on:input={previewJson}
            spellcheck="false"
            placeholder={jsonPlaceholder}
          ></textarea>
        </label>
        <p id="json-help" class="json-help">
          Les questions importées restent liées au salon et sont supprimées avec la partie.
        </p>
      </section>

      <div class="creator-footer">
        <div id="creator-status" class:bad={jsonError} class="json-status" role="status" aria-live="polite">
          <span class="mono">{jsonError || `${customCount} question(s) perso prêtes`}</span>
        </div>

        {#if error}<p class="error" role="alert">{error}</p>{/if}

        <Button type="submit" disabled={creating}>
          {creating ? 'Création…' : 'Créer le salon'}
        </Button>
      </div>
    </form>
  </section>
</main>

<style>
  .home {
    display: grid;
    grid-template-columns: minmax(0, 1.04fr) minmax(380px, 500px);
    gap: clamp(24px, 5vw, 56px);
    align-items: start;
    padding-block: clamp(18px, 4vh, 44px);
  }

  .hero-panel {
    position: sticky;
    top: 24px;
    display: grid;
    gap: 22px;
    min-width: 0;
  }

  .hero-copy {
    display: grid;
    gap: 14px;
  }

  .kicker,
  .creator-header p {
    margin: 0;
    color: var(--color-accent);
    font-weight: 900;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  h1 {
    max-width: 720px;
    font-size: clamp(2.65rem, 7vw, 5.75rem);
    letter-spacing: 0;
  }

  .lede {
    max-width: 620px;
    color: var(--color-muted);
    font-size: clamp(1rem, 2vw, 1.18rem);
    font-weight: 700;
  }

  .game-preview,
  .creator {
    border: 1px solid rgba(21, 19, 31, 0.10);
    border-radius: 28px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.68)),
      var(--surface);
    box-shadow: 0 28px 80px rgba(34, 33, 58, 0.14);
    backdrop-filter: blur(20px);
  }

  .game-preview {
    position: relative;
    overflow: hidden;
    display: grid;
    gap: 18px;
    padding: clamp(18px, 3vw, 26px);
  }

  .game-preview::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 12% 18%, rgba(255, 209, 102, 0.32), transparent 28%),
      radial-gradient(circle at 88% 8%, rgba(2, 166, 166, 0.22), transparent 28%),
      linear-gradient(150deg, rgba(255, 79, 121, 0.10), transparent 45%);
  }

  .preview-top,
  .question-preview,
  .preview-scoreboard {
    position: relative;
    z-index: 1;
  }

  .preview-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .preview-top div {
    display: grid;
    gap: 4px;
  }

  .preview-top span,
  .question-preview p,
  .preview-scoreboard > span {
    color: var(--color-accent);
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .preview-top strong {
    font-size: 1.25rem;
  }

  .live-pill {
    display: inline-grid;
    min-height: 34px;
    place-items: center;
    border-radius: 999px;
    background: var(--color-ink);
    color: white !important;
    padding: 0 12px;
    box-shadow: var(--shadow-soft);
  }

  .question-preview {
    display: grid;
    gap: 16px;
    border: 1px solid rgba(255, 255, 255, 0.68);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.72);
    padding: clamp(18px, 3vw, 24px);
  }

  .question-preview h2 {
    font-size: clamp(1.55rem, 3vw, 2.35rem);
  }

  .answer-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .answer-grid span {
    min-height: 44px;
    border: 1px solid var(--border-soft);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.82);
    padding: 11px 12px;
    color: var(--color-muted);
    font-weight: 900;
  }

  .answer-grid .selected {
    border-color: transparent;
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-strong));
    color: white;
    box-shadow: var(--shadow-pop);
  }

  .preview-scoreboard {
    display: grid;
    gap: 8px;
  }

  .preview-scoreboard div {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.66);
    padding: 7px 10px;
  }

  .preview-scoreboard b {
    display: grid;
    min-height: 30px;
    place-items: center;
    border-radius: 999px;
    background: var(--color-ink);
    color: white;
  }

  .preview-scoreboard em {
    color: var(--color-muted);
    font-style: normal;
    font-weight: 900;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .stats span {
    display: grid;
    min-height: 74px;
    align-content: center;
    gap: 2px;
    border: 1px solid var(--border-soft);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.70);
    padding: 12px;
    color: var(--color-muted);
    font-weight: 800;
  }

  .stats b {
    color: var(--color-ink);
    font-size: 1.45rem;
  }

  .creator {
    display: grid;
    gap: 0;
    overflow: hidden;
  }

  .creator-header,
  .settings-section,
  .creator-footer {
    padding: 20px;
  }

  .creator-header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid var(--border-soft);
    background: rgba(255, 255, 255, 0.58);
  }

  .creator-header h2 {
    font-size: 1.75rem;
  }

  .sound-toggle {
    min-height: 40px;
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    background: white;
    color: var(--color-ink);
    padding: 0 13px;
    font-weight: 900;
    transition:
      transform var(--duration-fast) var(--ease-pop),
      border-color var(--duration-fast) ease;
  }

  .sound-toggle:hover,
  .sound-toggle:focus-visible {
    outline: none;
    transform: translateY(-1px);
    border-color: rgba(255, 79, 121, 0.42);
  }

  .settings-section {
    display: grid;
    gap: 14px;
    border-bottom: 1px solid rgba(21, 19, 31, 0.08);
  }

  .section-title {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: baseline;
    gap: 10px;
  }

  .section-title > span {
    color: var(--color-accent);
    font-size: 12px;
    font-weight: 900;
  }

  .section-title h3 {
    font-size: 1rem;
  }

  .section-title small {
    overflow: hidden;
    color: var(--color-muted);
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  fieldset {
    min-width: 0;
    border: 0;
    margin: 0;
    padding: 0;
  }

  .option-grid,
  .chips,
  .toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .swatch,
  .chips button {
    min-height: 44px;
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.76);
    color: var(--color-ink);
    padding: 0 14px;
    font-weight: 900;
    transition:
      transform var(--duration-fast) var(--ease-pop),
      border-color var(--duration-fast) ease,
      background var(--duration-fast) ease,
      box-shadow var(--duration-fast) ease;
  }

  .swatch {
    display: inline-flex;
    align-items: center;
    gap: 9px;
  }

  .swatch span {
    width: 18px;
    aspect-ratio: 1;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--color-accent), var(--color-cyan));
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.72);
  }

  .swatch:hover,
  .chips button:hover,
  .swatch:focus-visible,
  .chips button:focus-visible {
    outline: none;
    transform: translateY(-2px);
    border-color: rgba(255, 79, 121, 0.44);
    box-shadow: var(--shadow-soft);
  }

  .swatch.active,
  .chips .active {
    border-color: transparent;
    background: var(--color-ink);
    color: white;
    box-shadow: 0 14px 30px rgba(21, 19, 31, 0.18);
  }

  .sliders {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .range-field {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    border: 1px solid var(--border-soft);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.68);
    padding: 14px;
  }

  .range-field span {
    color: var(--color-muted);
    font-weight: 900;
  }

  .range-field strong {
    color: var(--color-accent);
  }

  .range-field input {
    grid-column: 1 / -1;
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

  .json-section {
    background: rgba(255, 255, 255, 0.38);
  }

  .json-field textarea {
    min-height: 138px;
    border-radius: 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }

  .json-help {
    color: var(--color-muted);
    font-size: 0.9rem;
    font-weight: 700;
  }

  .creator-footer {
    display: grid;
    gap: 12px;
    background: rgba(255, 255, 255, 0.58);
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
    color: var(--color-danger);
    font-weight: 900;
  }

  @media (max-width: 980px) {
    .home {
      grid-template-columns: 1fr;
    }

    .hero-panel {
      position: static;
    }
  }

  @media (max-width: 640px) {
    .home {
      padding-block: 8px 20px;
    }

    .game-preview,
    .creator {
      border-radius: 22px;
    }

    .creator-header,
    .settings-section,
    .creator-footer {
      padding: 16px;
    }

    .creator-header,
    .sliders,
    .section-title {
      grid-template-columns: 1fr;
      display: grid;
    }

    .sound-toggle {
      width: 100%;
    }

    .answer-grid,
    .stats {
      grid-template-columns: 1fr;
    }

    .section-title small {
      white-space: normal;
    }
  }
</style>
