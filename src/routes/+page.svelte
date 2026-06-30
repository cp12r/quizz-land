<script>
  import { onMount } from 'svelte';
  import { pageTitle, siteMeta } from '$lib/config/site.js';
  import FloatingLogo3D from '$lib/components/FloatingLogo3D.svelte';
  import SceneBackground3D from '$lib/components/SceneBackground3D.svelte';
  import ThemePicker from '$lib/components/ThemePicker.svelte';
  import { createRoom } from '$lib/utils/api.js';
  import { getSeasonIcon } from '$lib/utils/seasonAssets.js';
  import { initSound, playSound, soundMuted, toggleSound } from '$lib/utils/sound.js';
  import { applyTheme } from '$lib/utils/theme.js';

  export let data;

  const QUESTION_MIN = 5;
  const QUESTION_MAX = 50;
  const TIME_MIN = 10;
  const TIME_MAX = 120;
  const answerLabels = ['A', 'B', 'C', 'D'];
  const title = pageTitle('Créer un quiz multijoueur');
  const description = siteMeta.description;

  const fallbackTheme = data.themes[0] || {
    id: 'neon',
    name: 'Néon Pop',
    label: 'Rose électrique + cyan',
    icon: '/season-1/icons/theme-neon.svg',
    colors: ['#ff4f79', '#39d5ff']
  };

  const categoryMeta = {
    culture: {
      label: 'Culture générale',
      short: 'Culture',
      stamp: '01',
      toneA: '#ffd54a',
      toneB: '#7c5cff',
      motion: 'float',
      detail: 'Classiques et surprises'
    },
    science: {
      label: 'Sciences',
      short: 'Sciences',
      stamp: '02',
      toneA: '#36d27c',
      toneB: '#39d5ff',
      motion: 'bubble',
      detail: 'Atomes, espace, logique'
    },
    web: {
      label: 'Internet',
      short: 'Internet',
      stamp: '03',
      toneA: '#39d5ff',
      toneB: '#7c5cff',
      motion: 'glitch',
      detail: 'Web, culture tech'
    },
    cinéma: {
      label: 'Cinéma',
      short: 'Cinéma',
      stamp: '04',
      toneA: '#e53935',
      toneB: '#ffd54a',
      motion: 'glow',
      detail: 'Films et pop culture'
    },
    sport: {
      label: 'Sport',
      short: 'Sport',
      stamp: '05',
      toneA: '#36d27c',
      toneB: '#ffd54a',
      motion: 'kick',
      detail: 'Stades et champions'
    },
    chaos: {
      label: 'Chaos Mode',
      short: 'Chaos',
      stamp: '??',
      toneA: '#ff4f79',
      toneB: '#7c5cff',
      motion: 'glitch',
      detail: 'Pièges rapides'
    },
    'world-cup-2026': {
      label: 'World Cup 2026',
      short: 'Mondial',
      stamp: '26',
      toneA: '#36d27c',
      toneB: '#ffd54a',
      motion: 'kick',
      detail: 'Format et villes hôtes'
    },
    blindtest: {
      label: 'Blindtest',
      short: 'Blindtest',
      stamp: 'BT',
      toneA: '#ff5a5f',
      toneB: '#ffd54a',
      motion: 'glow',
      detail: 'Artistes et classiques'
    },
    duel: {
      label: 'Duel',
      short: 'Duel',
      stamp: '1V1',
      toneA: '#e53935',
      toneB: '#39d5ff',
      motion: 'float',
      detail: 'Face-à-face'
    }
  };
  let draftId = 1;
  let name = '';
  let selectedCategories = data.categories.slice(0, 3);
  let questionCount = 8;
  let timePerQuestion = 30;
  let bonusTimer = true;
  let chillMode = false;
  let selectedTheme = data.themes[0]?.id || 'neon';
  let selectedMode = data.modes?.[0]?.id || 'classic';
  let joinCode = '';
  let creating = false;
  let error = '';
  let pointerX = 50;
  let pointerY = 42;
  let activeDraftId;
  let customDrafts = [createQuestionDraft('Quelle équipe gagne ce quiz ?', ['Équipe A', 'Équipe B', 'Équipe C', 'Équipe D'], 0)];

  activeDraftId = customDrafts[0].id;

  $: selectedThemeMeta = getThemeMeta(selectedTheme);
  $: selectedModeMeta = getModeMeta(selectedMode);
  $: modeUsesDedicatedPool = Boolean(
    selectedModeMeta.categories?.some((category) => !data.categories.includes(category))
  );
  $: roomName = name.trim() || 'Quiz entre amis';
  $: readyCustomQuestions = buildCustomQuestions(customDrafts);
  $: customCount = readyCustomQuestions.length;
  $: effectiveQuestionCount = selectedCategories.length ? questionCount : customCount;
  $: estimatedDuration = Math.max(1, Math.ceil((Math.max(1, effectiveQuestionCount) * timePerQuestion) / 60));
  $: customCountLabel = customCount === 1 ? '1 question perso' : `${customCount} questions perso`;
  $: activeDraft = customDrafts.find((draft) => draft.id === activeDraftId) || customDrafts[0];
  $: activeDraftIndex = Math.max(0, customDrafts.findIndex((draft) => draft.id === activeDraft?.id));
  $: activeDraftState = activeDraft ? getDraftState(activeDraft) : null;
  $: categoryLabel = modeUsesDedicatedPool
    ? selectedModeMeta.name
    : selectedCategories.length
    ? selectedCategories.map((category) => readableCategory(category)).join(' + ')
    : customCount
      ? customCountLabel
      : 'questions perso';
  $: questionDial = progressDeg(selectedCategories.length ? questionCount : customCount, QUESTION_MIN, QUESTION_MAX);
  $: timeDial = progressDeg(timePerQuestion, TIME_MIN, TIME_MAX);
  $: syncPreview = readyCustomQuestions.length
    ? JSON.stringify({ questions: readyCustomQuestions }, null, 2)
    : '{\n  "questions": []\n}';

  onMount(() => {
    initSound();
    chillMode = localStorage.getItem('quizz-chill') === 'true';
    selectedTheme = localStorage.getItem('quizz-theme') || selectedTheme;
    applyChillClass();
    applyTheme(selectedTheme);
  });

  function createQuestionDraft(text = '', answers = ['', '', '', ''], correctIndex = 0) {
    return {
      id: `draft-${draftId++}`,
      text,
      category: 'perso',
      image: '',
      imageAlt: '',
      answers: [...answers, '', '', '', ''].slice(0, 4),
      correctIndex
    };
  }

  function applyChillClass() {
    document.documentElement.classList.toggle('chill', chillMode);
  }

  function setChillMode(value) {
    chillMode = value;
    localStorage.setItem('quizz-chill', value ? 'true' : 'false');
    applyChillClass();
    playSound('ui');
  }

  function setTheme(themeId) {
    selectedTheme = themeId;
    localStorage.setItem('quizz-theme', themeId);
    applyTheme(themeId);
    playSound('ui');
  }

  function toggleCategory(category) {
    if (modeUsesDedicatedPool) return;
    selectedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];
    playSound('ui');
  }

  function buildCustomQuestions(drafts) {
    return drafts
      .map((draft, index) => {
        const filledAnswers = draft.answers
          .map((answer, answerIndex) => ({ answer: answer.trim(), answerIndex }))
          .filter(({ answer }) => answer);
        const answers = filledAnswers.map(({ answer }) => answer);
        const correctIndex = filledAnswers.findIndex(({ answerIndex }) => answerIndex === draft.correctIndex);

        if (!draft.text.trim() || answers.length < 2 || correctIndex < 0) return null;

        return {
          id: `custom-${index + 1}`,
          text: draft.text.trim(),
          answers,
          correctIndex,
          category: draft.category.trim() || 'perso',
          ...(draft.image.trim() ? { image: draft.image.trim() } : {}),
          ...(draft.imageAlt.trim() ? { imageAlt: draft.imageAlt.trim() } : {})
        };
      })
      .filter(Boolean);
  }

  function updateDraft(id, patch) {
    customDrafts = customDrafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft));
  }

  function updateAnswer(id, answerIndex, value) {
    customDrafts = customDrafts.map((draft) => {
      if (draft.id !== id) return draft;
      const answers = draft.answers.map((answer, index) => (index === answerIndex ? value : answer));
      return { ...draft, answers };
    });
  }

  function setCorrectAnswer(id, answerIndex) {
    updateDraft(id, { correctIndex: answerIndex });
    playSound('ui');
  }

  function addDraft() {
    const draft = createQuestionDraft();
    customDrafts = [...customDrafts, draft];
    activeDraftId = draft.id;
    playSound('ui');
  }

  function duplicateDraft(id) {
    const source = customDrafts.find((draft) => draft.id === id);
    if (!source) return;
    const copy = createQuestionDraft(source.text, source.answers, source.correctIndex);
    copy.category = source.category;
    copy.image = source.image;
    copy.imageAlt = source.imageAlt;
    customDrafts = [...customDrafts, copy];
    activeDraftId = copy.id;
    playSound('ui');
  }

  function removeDraft(id) {
    removeDraftAt(customDrafts.findIndex((draft) => draft.id === id));
  }

  function removeDraftAt(index) {
    if (index < 0 || index >= customDrafts.length) return;

    if (customDrafts.length === 1) {
      customDrafts = [createQuestionDraft()];
      activeDraftId = customDrafts[0].id;
      playSound('ui');
      return;
    }

    const nextDrafts = customDrafts.filter((_, draftIndex) => draftIndex !== index);
    customDrafts = nextDrafts;
    activeDraftId = nextDrafts[Math.max(0, Math.min(index, nextDrafts.length - 1))]?.id;
    playSound('ui');
  }

  function setNumberValue(key, delta) {
    if (key === 'questions') {
      questionCount = clamp(questionCount + delta, QUESTION_MIN, QUESTION_MAX);
    } else {
      timePerQuestion = clamp(timePerQuestion + delta, TIME_MIN, TIME_MAX);
    }
    playSound('ui');
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function progressDeg(value, min, max) {
    return `${((clamp(value, min, max) - min) / (max - min)) * 360}deg`;
  }

  function getThemeMeta(themeId) {
    return data.themes.find((theme) => theme.id === themeId) || fallbackTheme;
  }

  function getModeMeta(modeId) {
    return (data.modes || []).find((mode) => mode.id === modeId) || {
      id: 'classic',
      name: 'Classic Quiz',
      label: 'Quiz net, rapide, efficace'
    };
  }

  function setMode(modeId) {
    const mode = getModeMeta(modeId);
    selectedMode = mode.id;
    if (mode.categories?.length) selectedCategories = mode.categories;
    else if (selectedCategories.some((category) => !data.categories.includes(category))) {
      selectedCategories = data.categories.slice(0, 3);
    }
    if (mode.questionCount) questionCount = clamp(mode.questionCount, QUESTION_MIN, QUESTION_MAX);
    if (mode.timePerQuestion) timePerQuestion = clamp(mode.timePerQuestion, TIME_MIN, TIME_MAX);
    if (mode.bonusTimer !== undefined) bonusTimer = Boolean(mode.bonusTimer);
    playSound('ui');
  }

  function categoryStyle(category, index) {
    const meta = getCategoryMeta(category);
    return `--cat-a:${meta.toneA}; --cat-b:${meta.toneB}; --delay:${index * 70}ms;`;
  }

  function readableCategory(category) {
    return getCategoryMeta(category).label;
  }

  function getCategoryMeta(category) {
    return categoryMeta[category] || {
      label: category,
      short: category,
      stamp: 'QL',
      toneA: '#ffd54a',
      toneB: '#39d5ff',
      motion: 'float',
      detail: 'Pack quiz'
    };
  }

  function getDraftState(draft) {
    if (!draft?.text.trim()) {
      return { ready: false, label: 'brouillon', detail: 'Question vide' };
    }

    const filledAnswers = draft.answers
      .map((answer, answerIndex) => ({ answer: answer.trim(), answerIndex }))
      .filter(({ answer }) => answer);

    if (filledAnswers.length < 2) {
      return { ready: false, label: 'brouillon', detail: 'Deux réponses minimum' };
    }

    if (!filledAnswers.some(({ answerIndex }) => answerIndex === draft.correctIndex)) {
      return { ready: false, label: 'brouillon', detail: 'Bonne réponse manquante' };
    }

    return { ready: true, label: 'prêt', detail: 'Question prête' };
  }

  function trackPointer(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / bounds.width) * 100;
    pointerY = ((event.clientY - bounds.top) / bounds.height) * 100;
  }

  async function submit() {
    error = '';

    if (!selectedCategories.length && !readyCustomQuestions.length) {
      error = 'Choisis une catégorie ou ajoute une question prête.';
      return;
    }

    creating = true;
    playSound('start');

    try {
      const { room } = await createRoom({
        name,
        categories: selectedCategories,
        timePerQuestion,
        bonusTimer,
        themeId: selectedTheme,
        modeId: selectedMode,
        questionCount: selectedCategories.length ? questionCount : readyCustomQuestions.length,
        customQuestions: readyCustomQuestions
      });
      location.href = `/room/${room.id}`;
    } catch (err) {
      console.error('Création du salon impossible', err);
      error = 'Impossible de créer le salon pour le moment.';
      creating = false;
    }
  }

  function joinRoom() {
    const code = joinCode.trim();
    if (!code) return;
    location.href = `/room/${code}`;
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

<main
  class="party-page"
  on:mousemove={trackPointer}
  style={`--pointer-x:${pointerX}%; --pointer-y:${pointerY}%;`}
>
  <SceneBackground3D variant="creator" intensity={0.42} />

  <div class="ambient-field" aria-hidden="true">
    <span class="light-ribbon ribbon-a"></span>
    <span class="light-ribbon ribbon-b"></span>
    <span class="pixel-dust"></span>
  </div>

  <form class="party-stage" on:submit|preventDefault={submit} aria-describedby="creator-status">
    <header class="hero">
      <div class="hero-copy">
        <p class="brand-line">QUIZZ LAND / QUIZ ENTRE AMIS</p>
        <h1>
          <span>Crée</span>
          <span>ton quiz.</span>
        </h1>
        <p class="hero-speed mono">Room prête en 10 secondes</p>
        <div class="quick-actions" aria-label="Actions rapides">
          <button type="submit" disabled={creating}>Créer une room</button>
          <a href="#theme-picker">Choisir un thème</a>
          <button type="submit" disabled={creating}>Partie rapide</button>
        </div>
        <div class="quick-join" id="join-room">
          <input bind:value={joinCode} maxlength="12" placeholder="Code room" aria-label="Code room" />
          <button type="button" on:click={joinRoom}>Rejoindre</button>
        </div>
        <div class="hero-marquee" aria-hidden="true">
          <span>{categoryLabel}</span>
          <span>{estimatedDuration} minutes</span>
          <span>{customCountLabel}</span>
          <span>{selectedThemeMeta.name}</span>
          <span>{selectedModeMeta.name}</span>
        </div>
      </div>

      <div class="launch-pod">
        <FloatingLogo3D />

        <button
          type="button"
          class="sound-puck"
          on:click={toggleSound}
          aria-label={$soundMuted ? 'Activer le son' : 'Couper le son'}
          aria-pressed={!$soundMuted}
        >
          <span aria-hidden="true">{$soundMuted ? 'OFF' : 'ON'}</span>
        </button>

        <button class="launch-button" type="submit" disabled={creating}>
          <span>{creating ? 'Ouverture' : 'Créer'}</span>
          <strong>{creating ? '...' : 'le salon'}</strong>
        </button>

        <div class="pod-readout" aria-hidden="true">
          <span>{effectiveQuestionCount}Q</span>
          <span>{timePerQuestion}s</span>
          <span>{bonusTimer ? 'bonus' : 'normal'}</span>
        </div>
      </div>
    </header>

    <section class="mode-showcase" aria-label="Modes de jeu">
      {#each data.modes || [] as mode, index}
        <button
          type="button"
          class:active={selectedMode === mode.id}
          style={`--mode-delay:${index * 55}ms;`}
          on:click={() => setMode(mode.id)}
          aria-pressed={selectedMode === mode.id}
        >
          <span class="mono">{String(index + 1).padStart(2, '0')}</span>
          <strong>{mode.name}</strong>
          <em>{mode.label}</em>
        </button>
      {/each}
    </section>

    <section class="live-scene" aria-label="Aperçu du salon">
      <div class="screen-stack">
        <div class="signal-strip" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <div class="room-screen">
          <p class="screen-kicker">{selectedThemeMeta.label}</p>
          <h2>{roomName}</h2>
          <div class="question-broadcast">
            <span>Question 03</span>
            <strong>Qui marque le plus de points sur cette question ?</strong>
          </div>
          <div class="answer-stack" aria-hidden="true">
            <span class="answer-hot">A / Camille</span>
            <span>B / Sam</span>
            <span>C / Alex</span>
            <span>D / Nora</span>
          </div>
        </div>
      </div>

      <div class="floating-score score-a" aria-hidden="true">
        <span>01</span>
        <strong>Camille</strong>
        <em>420</em>
      </div>
      <div class="floating-score score-b" aria-hidden="true">
        <span>02</span>
        <strong>Sam</strong>
        <em>390</em>
      </div>
    </section>

    <section class="control-table" aria-label="Préparation du salon">
      <div class="name-console console-panel">
        <div class="panel-tag">Nom</div>
        <label class="name-field">
          <span>Nom du salon</span>
          <input bind:value={name} maxlength="36" placeholder="Quiz entre amis" autocomplete="off" />
        </label>
        <div class="ticket-edge" aria-hidden="true">
          <span>{roomName}</span>
          <span>{estimatedDuration} min</span>
        </div>
      </div>

      <div class="vibe-console console-panel" id="theme-picker">
        <div class="panel-tag">Thème</div>
        <ThemePicker themes={data.themes} selected={selectedTheme} onSelect={setTheme} />
      </div>

      <div class="category-console console-panel">
        <div class="panel-tag">Catégories</div>
        <div class="category-deck">
          {#each data.categories as category, index}
            {@const meta = getCategoryMeta(category)}
            <button
              type="button"
              class:active={selectedCategories.includes(category)}
              class={`category-token motion-${meta.motion}`}
              style={categoryStyle(category, index)}
              on:click={() => toggleCategory(category)}
              aria-pressed={selectedCategories.includes(category)}
            >
              <span>{meta.stamp}</span>
              <img class="category-asset" src={getSeasonIcon(category)} alt="" aria-hidden="true" loading="lazy" />
              <strong>{meta.short}</strong>
              <em>{selectedCategories.includes(category) ? 'sélectionné' : meta.detail}</em>
            </button>
          {/each}
        </div>
      </div>

      <div class="tempo-console console-panel">
        <div class="panel-tag">Temps</div>
        <div class="dial-grid">
          <div class="dial-control" style={`--progress:${questionDial};`}>
            <button
              type="button"
              on:click={() => setNumberValue('questions', -1)}
              aria-label="Moins de questions"
              disabled={!selectedCategories.length}
            >
              -
            </button>
            <div class="dial-face">
              <span>{selectedCategories.length ? 'questions' : 'perso prêtes'}</span>
              <strong>{effectiveQuestionCount}</strong>
            </div>
            <button
              type="button"
              on:click={() => setNumberValue('questions', 1)}
              aria-label="Plus de questions"
              disabled={!selectedCategories.length}
            >
              +
            </button>
          </div>

          <div class="dial-control" style={`--progress:${timeDial};`}>
            <button type="button" on:click={() => setNumberValue('time', -5)} aria-label="Moins de temps">
              -
            </button>
            <div class="dial-face">
              <span>secondes</span>
              <strong>{timePerQuestion}</strong>
            </div>
            <button type="button" on:click={() => setNumberValue('time', 5)} aria-label="Plus de temps">
              +
            </button>
          </div>
        </div>

        <div class="toggle-row">
          <button
            type="button"
            class:active={bonusTimer}
            class="flip-toggle"
            on:click={() => {
              bonusTimer = !bonusTimer;
              playSound('ui');
            }}
            aria-pressed={bonusTimer}
          >
            <span></span>
            <strong>Bonus temps</strong>
          </button>

          <button
            type="button"
            class:active={chillMode}
            class="flip-toggle"
            on:click={() => setChillMode(!chillMode)}
            aria-pressed={chillMode}
          >
            <span></span>
            <strong>Mode calme</strong>
          </button>
        </div>
      </div>
    </section>

    <section class="question-lab" aria-label="Éditeur de questions maison">
      <div class="lab-header">
        <div>
          <p class="panel-tag">Questions perso</p>
          <h2>Questions personnalisées</h2>
        </div>
        <button type="button" class="add-card" on:click={addDraft}>
          <span>+</span>
          <strong>Nouvelle question</strong>
        </button>
      </div>

      <div class="draft-strip" aria-label="Questions personnalisées">
        {#each customDrafts as draft, index (draft.id)}
          {@const state = getDraftState(draft)}
          <div class:active={activeDraftId === draft.id} class:ready={state.ready} class="draft-item">
            <button
              type="button"
              class="draft-select"
              on:click={() => (activeDraftId = draft.id)}
              aria-label={`Modifier la question ${index + 1}`}
            >
              <span>Q{index + 1}</span>
              <strong>{state.label}</strong>
              <em>{draft.text.trim() || 'Question vide'}</em>
            </button>
            <button
              type="button"
              class="draft-delete"
              on:click|stopPropagation={() => removeDraftAt(index)}
              aria-label={`Supprimer la question ${index + 1}`}
              title="Supprimer"
            >
              x
            </button>
          </div>
        {/each}
      </div>

      {#if activeDraft}
        <div class:ready={activeDraftState?.ready} class="lab-status">
          <span>{activeDraftState?.label}</span>
          <strong>{activeDraftState?.detail}</strong>
        </div>

        <div class="active-draft-toolbar">
          <span class="mono">Question {activeDraftIndex + 1}/{customDrafts.length}</span>
          <div>
            <button type="button" on:click={() => duplicateDraft(activeDraft.id)}>Dupliquer</button>
            <button type="button" class="danger" on:click={() => removeDraft(activeDraft.id)}>Supprimer</button>
          </div>
        </div>

        <div class="builder-grid">
          <label class="question-field">
            <span>Question</span>
            <textarea
              value={activeDraft.text}
              on:input={(event) => updateDraft(activeDraft.id, { text: event.currentTarget.value })}
              maxlength="220"
              placeholder="Écris ta question..."
            ></textarea>
          </label>

          <div class="answer-board">
            {#each activeDraft.answers as answer, index}
              <div class:correct={activeDraft.correctIndex === index} class="answer-slot">
                <button
                  type="button"
                  class="answer-key"
                  on:click={() => setCorrectAnswer(activeDraft.id, index)}
                  aria-label={`Marquer la réponse ${answerLabels[index]} comme correcte`}
                  aria-pressed={activeDraft.correctIndex === index}
                >
                  {answerLabels[index]}
                </button>
                <input
                  value={answer}
                  on:input={(event) => updateAnswer(activeDraft.id, index, event.currentTarget.value)}
                  maxlength="90"
                  placeholder={`Réponse ${answerLabels[index]}`}
                />
              </div>
            {/each}
          </div>

          <div class="metadata-board">
            <label>
              <span>Catégorie</span>
              <input
                value={activeDraft.category}
                on:input={(event) => updateDraft(activeDraft.id, { category: event.currentTarget.value })}
                maxlength="32"
                placeholder="perso"
              />
            </label>

            <label>
              <span>URL de l'image</span>
              <input
                value={activeDraft.image}
                on:input={(event) => updateDraft(activeDraft.id, { image: event.currentTarget.value })}
                maxlength="600"
                placeholder="https://..."
              />
            </label>

            <label>
              <span>Description image</span>
              <input
                value={activeDraft.imageAlt}
                on:input={(event) => updateDraft(activeDraft.id, { imageAlt: event.currentTarget.value })}
                maxlength="140"
                placeholder="description courte"
              />
            </label>
          </div>

          {#if activeDraft.image.trim()}
            <figure class="image-preview">
              <img src={activeDraft.image.trim()} alt={activeDraft.imageAlt.trim() || 'Aperçu image'} loading="lazy" />
              <figcaption>{activeDraft.imageAlt.trim() || 'Aperçu image'}</figcaption>
            </figure>
          {/if}
        </div>
      {/if}

      <details class="json-sync">
        <summary>
          <span>Aperçu des questions</span>
          <strong>{customCount} prête{customCount > 1 ? 's' : ''}</strong>
        </summary>
        <pre>{syncPreview}</pre>
      </details>
    </section>

    <footer class="creator-footer">
      <div id="creator-status" class="creator-status" role="status" aria-live="polite">
        <span>{selectedCategories.length} catégories</span>
        <span>{customCountLabel}</span>
        <span>{estimatedDuration} minutes</span>
      </div>

      {#if error}<p class="error" role="alert">{error}</p>{/if}
    </footer>
  </form>
</main>

<style>
  :global(body) {
    overflow-x: hidden;
  }

  button,
  input,
  textarea {
    letter-spacing: 0;
  }

  .party-page {
    --ink: #0b1020;
    --paper: #e6e8ef;
    --paper-dim: rgba(230, 232, 239, 0.72);
    --line: rgba(230, 232, 239, 0.18);
    --hot: var(--color-accent);
    --cyan: var(--color-cyan);
    --yellow: var(--color-yellow);
    --lime: var(--color-mint);
    --orange: #ff5a5f;
    position: relative;
    isolation: isolate;
    min-height: 100svh;
    overflow: hidden;
    padding: 28px;
    background:
      linear-gradient(118deg, rgba(229, 57, 53, 0.18), transparent 32%),
      linear-gradient(248deg, rgba(57, 213, 255, 0.16), transparent 36%),
      conic-gradient(from 120deg at var(--pointer-x) var(--pointer-y), #171e31, #0b1020, #0f0e12, #212a45, #0b1020);
    color: var(--paper);
  }

  .party-page::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -2;
    pointer-events: none;
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.24'/%3E%3C/svg%3E"),
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 86px),
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.025) 0 1px, transparent 1px 86px);
    mix-blend-mode: screen;
    opacity: 0.46;
  }

  .party-page::after {
    content: '';
    position: fixed;
    inset: auto -20% -24% -20%;
    z-index: -1;
    height: 52svh;
    background:
      linear-gradient(90deg, transparent, rgba(255, 213, 74, 0.14), transparent),
      linear-gradient(118deg, rgba(229, 57, 53, 0.22), rgba(57, 213, 255, 0.16), rgba(54, 210, 124, 0.14));
    filter: blur(42px);
    transform: skewY(-8deg);
    animation: floor-shift 12s ease-in-out infinite alternate;
  }

  .ambient-field {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
  }

  .light-ribbon {
    position: absolute;
    width: 80vw;
    height: 16vh;
    border: 1px solid rgba(230, 232, 239, 0.14);
    background: linear-gradient(90deg, transparent, rgba(230, 232, 239, 0.08), transparent);
    filter: blur(4px);
    transform-origin: center;
  }

  .ribbon-a {
    top: 10%;
    left: -20%;
    transform: rotate(-12deg);
    animation: ribbon-glide 11s ease-in-out infinite alternate;
  }

  .ribbon-b {
    right: -28%;
    bottom: 24%;
    transform: rotate(18deg);
    animation: ribbon-glide 14s ease-in-out infinite alternate-reverse;
  }

  .pixel-dust {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(90deg, rgba(229, 57, 53, 0.26) 2px, transparent 2px),
      linear-gradient(90deg, rgba(57, 213, 255, 0.22) 2px, transparent 2px),
      linear-gradient(90deg, rgba(255, 213, 74, 0.2) 2px, transparent 2px);
    background-position:
      7% 22%,
      74% 18%,
      53% 76%;
    background-repeat: no-repeat;
    background-size:
      54px 3px,
      88px 3px,
      62px 3px;
    animation: dust-tick 4s steps(2, end) infinite;
  }

  .party-stage {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(340px, 0.78fr);
    grid-template-areas:
      'hero live'
      'modes live'
      'controls live'
      'lab lab'
      'footer footer';
    gap: 22px;
    width: min(1420px, 100%);
    margin: 0 auto;
  }

  .hero {
    grid-area: hero;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 20px;
    min-height: 430px;
    align-items: end;
    padding: 30px 0 10px;
  }

  .hero-copy {
    display: grid;
    gap: 20px;
  }

  .brand-line,
  .panel-tag,
  .screen-kicker {
    margin: 0;
    color: var(--yellow);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    display: grid;
    max-width: 700px;
    font-size: clamp(4.6rem, 8.2vw, 7.6rem);
    line-height: 0.84;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1 span:nth-child(2) {
    color: transparent;
    -webkit-text-stroke: 2px var(--paper);
    text-shadow: 0 20px 55px rgba(229, 57, 53, 0.32);
  }

  .hero-speed {
    justify-self: start;
    margin: -4px 0 0;
    border: 1px solid rgba(255, 213, 74, 0.26);
    border-radius: 999px;
    background: rgba(255, 213, 74, 0.1);
    color: var(--yellow);
    padding: 8px 12px;
    font-size: 0.78rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .hero-marquee {
    display: flex;
    width: min(720px, 100%);
    min-height: 54px;
    align-items: center;
    gap: 10px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: rgba(230, 232, 239, 0.07);
    box-shadow: inset 0 0 30px rgba(230, 232, 239, 0.04);
    backdrop-filter: blur(20px);
    clip-path: polygon(0 0, 96% 0, 100% 32%, 100% 100%, 4% 100%, 0 68%);
  }

  .hero-marquee span {
    flex: 0 0 auto;
    padding: 0 18px;
    color: var(--paper);
    font-weight: 900;
    text-transform: uppercase;
  }

  .hero-marquee span:not(:last-child) {
    border-right: 1px solid var(--line);
  }

  .quick-actions,
  .quick-join {
    display: flex;
    width: min(720px, 100%);
    flex-wrap: wrap;
    gap: 10px;
  }

  .quick-actions button,
  .quick-actions a,
  .quick-join button,
  .quick-join input {
    min-height: 46px;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 8px;
    padding: 0 14px;
    font-weight: 950;
    text-transform: uppercase;
  }

  .quick-actions button,
  .quick-actions a,
  .quick-join button {
    display: inline-grid;
    place-items: center;
    background: rgba(230, 232, 239, 0.08);
    color: var(--paper);
    text-decoration: none;
    transition:
      transform 180ms ease,
      border-color 180ms ease,
      background 180ms ease;
  }

  .quick-actions button:hover,
  .quick-actions a:hover,
  .quick-join button:hover {
    border-color: rgba(255, 213, 74, 0.42);
    background: rgba(255, 213, 74, 0.12);
    transform: translateY(-3px) rotateX(4deg);
  }

  .quick-join input {
    min-width: min(220px, 100%);
    background: rgba(11, 16, 32, 0.62);
    color: var(--paper);
  }

  .mode-showcase {
    grid-area: modes;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
  }

  .mode-showcase button {
    display: grid;
    min-width: 0;
    min-height: 132px;
    align-content: space-between;
    overflow: hidden;
    border: 1px solid rgba(230, 232, 239, 0.15);
    border-radius: 8px;
    padding: 14px;
    text-align: left;
    background:
      radial-gradient(circle at 20% 0%, rgba(57, 213, 255, 0.16), transparent 42%),
      linear-gradient(145deg, rgba(230, 232, 239, 0.09), rgba(230, 232, 239, 0.035)),
      rgba(11, 16, 32, 0.68);
    color: var(--paper);
    animation: token-enter 340ms cubic-bezier(0.16, 1.1, 0.3, 1) both;
    animation-delay: var(--mode-delay);
    transition:
      transform 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease;
  }

  .mode-showcase button:hover,
  .mode-showcase button:focus-visible,
  .mode-showcase button.active {
    border-color: rgba(57, 213, 255, 0.38);
    box-shadow: 0 22px 44px rgba(0, 0, 0, 0.24), 0 0 24px rgba(57, 213, 255, 0.1);
    transform: translateY(-5px) rotateX(4deg);
  }

  .mode-showcase button.active {
    border-color: rgba(255, 213, 74, 0.56);
    background:
      radial-gradient(circle at 20% 0%, rgba(255, 213, 74, 0.2), transparent 42%),
      linear-gradient(145deg, rgba(230, 232, 239, 0.11), rgba(230, 232, 239, 0.04)),
      rgba(11, 16, 32, 0.78);
  }

  .mode-showcase span {
    color: var(--yellow);
    font-size: 0.7rem;
    font-weight: 950;
  }

  .mode-showcase strong {
    overflow-wrap: anywhere;
    font-size: 1.08rem;
    line-height: 1;
    text-transform: uppercase;
  }

  .mode-showcase em {
    color: var(--paper-dim);
    font-size: 0.78rem;
    font-style: normal;
    font-weight: 850;
    line-height: 1.25;
  }

  .launch-pod {
    display: grid;
    justify-items: center;
    gap: 14px;
    align-self: start;
    margin-top: 54px;
    transform: translateY(-42px) rotate(4deg);
  }

  .sound-puck,
  .launch-button {
    border: 0;
    color: var(--ink);
    transition:
      transform 260ms cubic-bezier(0.16, 1.1, 0.3, 1),
      filter 260ms ease,
      box-shadow 260ms ease;
  }

  .sound-puck {
    display: grid;
    width: 76px;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgba(230, 232, 239, 0.4);
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 22px 40px rgba(0, 0, 0, 0.22);
  }

  .sound-puck span {
    font-size: 2rem;
    font-weight: 950;
    line-height: 1;
  }

  .launch-button {
    position: relative;
    display: grid;
    width: 230px;
    aspect-ratio: 1;
    place-items: center;
    overflow: hidden;
    border-radius: 50%;
    background:
      linear-gradient(145deg, rgba(255, 255, 255, 0.88), transparent 42%),
      conic-gradient(from 180deg, var(--yellow), var(--hot), var(--cyan), var(--lime), var(--yellow));
    box-shadow:
      0 36px 70px rgba(0, 0, 0, 0.32),
      0 0 70px rgba(229, 57, 53, 0.28);
    font-family: Sora, Inter, system-ui, sans-serif;
    text-transform: uppercase;
  }

  .launch-button::before {
    content: '';
    position: absolute;
    inset: 16px;
    border: 1px solid rgba(11, 16, 32, 0.22);
    border-radius: 50%;
    background: rgba(230, 232, 239, 0.86);
  }

  .launch-button span,
  .launch-button strong {
    position: relative;
    z-index: 1;
    line-height: 0.95;
  }

  .launch-button span {
    align-self: end;
    font-size: 2.05rem;
    font-weight: 950;
  }

  .launch-button strong {
    align-self: start;
    font-size: 1.15rem;
  }

  .launch-button:hover:not(:disabled),
  .sound-puck:hover {
    transform: translate3d(0, -8px, 0) rotate(-3deg) scale(1.03);
    filter: saturate(1.16);
  }

  .launch-button:active:not(:disabled),
  .sound-puck:active {
    transform: translateY(-2px) scale(0.97);
  }

  .launch-button:focus-visible,
  .sound-puck:focus-visible,
  .category-token:focus-visible,
  .dial-control button:focus-visible,
  .flip-toggle:focus-visible,
  .add-card:focus-visible,
  .draft-strip button:focus-visible,
  .active-draft-toolbar button:focus-visible,
  .answer-key:focus-visible {
    outline: 2px solid var(--yellow);
    outline-offset: 4px;
  }

  .launch-button:disabled {
    cursor: wait;
    filter: grayscale(0.35);
  }

  .pod-readout {
    display: flex;
    gap: 7px;
    color: var(--paper);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .pod-readout span {
    border: 1px solid var(--line);
    padding: 6px 8px;
    background: rgba(230, 232, 239, 0.06);
  }

  .live-scene {
    position: sticky;
    top: 28px;
    grid-area: live;
    min-height: 720px;
    perspective: 1200px;
  }

  .screen-stack {
    position: relative;
    transform: rotateY(-10deg) rotateX(5deg) translateY(34px);
    transform-style: preserve-3d;
  }

  .signal-strip {
    position: absolute;
    top: -24px;
    right: 8%;
    display: flex;
    gap: 7px;
    transform: translateZ(90px) rotate(5deg);
  }

  .signal-strip span {
    width: 22px;
    height: 70px;
    border: 1px solid rgba(230, 232, 239, 0.2);
    background: linear-gradient(180deg, var(--yellow), var(--hot));
    animation: meter-pop 1.6s ease-in-out infinite alternate;
  }

  .signal-strip span:nth-child(2) {
    height: 105px;
    animation-delay: 120ms;
  }

  .signal-strip span:nth-child(3) {
    height: 54px;
    animation-delay: 240ms;
  }

  .signal-strip span:nth-child(4) {
    height: 92px;
    animation-delay: 360ms;
  }

  .signal-strip span:nth-child(5) {
    height: 124px;
    animation-delay: 480ms;
  }

  .room-screen {
    position: relative;
    display: grid;
    min-height: 620px;
    align-content: space-between;
    gap: 24px;
    border: 1px solid rgba(230, 232, 239, 0.22);
    border-radius: 8px;
    padding: 28px;
    background:
      linear-gradient(140deg, rgba(230, 232, 239, 0.16), rgba(230, 232, 239, 0.04)),
      linear-gradient(180deg, rgba(229, 57, 53, 0.16), rgba(57, 213, 255, 0.08)),
      rgba(230, 232, 239, 0.08);
    box-shadow:
      0 46px 90px rgba(0, 0, 0, 0.38),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(28px);
    clip-path: polygon(0 0, 94% 0, 100% 7%, 100% 100%, 8% 100%, 0 92%);
  }

  .room-screen::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent),
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.055) 0 1px, transparent 1px 8px);
    mix-blend-mode: screen;
    animation: scanline 5s linear infinite;
  }

  .room-screen h2 {
    position: relative;
    max-width: 440px;
    font-size: 4rem;
    line-height: 0.92;
    text-transform: uppercase;
  }

  .question-broadcast {
    position: relative;
    display: grid;
    gap: 12px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    padding: 22px 0;
  }

  .question-broadcast span {
    color: var(--cyan);
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800;
    text-transform: uppercase;
  }

  .question-broadcast strong {
    max-width: 470px;
    font-size: 1.55rem;
    line-height: 1.05;
  }

  .answer-stack {
    position: relative;
    display: grid;
    gap: 10px;
  }

  .answer-stack span {
    display: block;
    min-height: 48px;
    border: 1px solid rgba(230, 232, 239, 0.18);
    padding: 12px 14px;
    background: rgba(11, 16, 32, 0.42);
    font-weight: 900;
    text-transform: uppercase;
    transform: skewX(-7deg);
  }

  .answer-stack .answer-hot {
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 0 34px rgba(255, 213, 74, 0.22);
  }

  .floating-score {
    position: absolute;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    width: min(270px, 70%);
    border: 1px solid rgba(230, 232, 239, 0.26);
    border-radius: 8px;
    padding: 12px;
    background: rgba(230, 232, 239, 0.86);
    color: var(--ink);
    box-shadow: 0 28px 50px rgba(0, 0, 0, 0.25);
    font-weight: 900;
    transform-style: preserve-3d;
  }

  .floating-score span {
    display: grid;
    width: 42px;
    aspect-ratio: 1;
    place-items: center;
    border-radius: 50%;
    background: var(--ink);
    color: var(--paper);
    font-family: 'JetBrains Mono', monospace;
  }

  .floating-score em {
    color: var(--hot);
    font-style: normal;
  }

  .score-a {
    top: 520px;
    left: -46px;
    transform: rotate(-8deg);
    animation: float-card 5s ease-in-out infinite;
  }

  .score-b {
    top: 176px;
    right: -38px;
    transform: rotate(7deg);
    animation: float-card 6s ease-in-out infinite reverse;
  }

  .control-table {
    grid-area: controls;
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 16px;
    align-items: stretch;
  }

  .console-panel,
  .question-lab {
    position: relative;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 8px;
    background:
      linear-gradient(145deg, rgba(230, 232, 239, 0.16), rgba(230, 232, 239, 0.055)),
      rgba(11, 16, 32, 0.36);
    box-shadow: 0 26px 70px rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(24px);
  }

  .console-panel {
    min-height: 250px;
    padding: 18px;
    transition:
      transform 260ms cubic-bezier(0.16, 1.1, 0.3, 1),
      border-color 260ms ease,
      background 260ms ease;
  }

  .console-panel:hover {
    border-color: rgba(255, 213, 74, 0.48);
    transform: translateY(-6px) rotate(var(--hover-rotate, 0deg));
  }

  .name-console {
    --hover-rotate: -1deg;
    display: grid;
    align-content: space-between;
    gap: 16px;
    background:
      linear-gradient(145deg, rgba(255, 213, 74, 0.18), rgba(230, 232, 239, 0.05)),
      rgba(11, 16, 32, 0.42);
  }

  .vibe-console {
    --hover-rotate: 1deg;
    display: grid;
    gap: 16px;
  }

  .category-console {
    --hover-rotate: -1deg;
    grid-column: span 2;
    display: grid;
    gap: 16px;
  }

  .tempo-console {
    --hover-rotate: 1deg;
    grid-column: span 2;
    display: grid;
    gap: 18px;
  }

  .name-field,
  .question-field,
  .metadata-board label {
    display: grid;
    gap: 10px;
  }

  .name-field span,
  .question-field span,
  .metadata-board span {
    color: var(--paper-dim);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .name-field input {
    min-width: 0;
    width: 100%;
    border: 0;
    border-bottom: 3px solid var(--paper);
    padding: 0 0 12px;
    background: transparent;
    color: var(--paper);
    font-family: Sora, Inter, system-ui, sans-serif;
    font-size: 2.35rem;
    font-weight: 950;
    line-height: 1;
    text-transform: uppercase;
  }

  .name-field input::placeholder,
  .question-field textarea::placeholder,
  .answer-slot input::placeholder,
  .metadata-board input::placeholder {
    color: rgba(230, 232, 239, 0.42);
  }

  .name-field input:focus,
  .question-field textarea:focus,
  .answer-slot input:focus,
  .metadata-board input:focus {
    outline: none;
    box-shadow: 0 8px 0 -5px var(--yellow);
  }

  .ticket-edge {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    border: 1px dashed rgba(230, 232, 239, 0.28);
    padding: 12px;
    color: var(--paper-dim);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .theme-rack {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(172px, 100%), 1fr));
    gap: 12px;
  }

  .theme-card-shell {
    display: grid;
    min-width: 0;
  }

  .category-deck {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(158px, 100%), 1fr));
    gap: 12px;
  }

  .category-token {
    position: relative;
    display: grid;
    min-height: 174px;
    aspect-ratio: 1 / 1.05;
    align-content: space-between;
    justify-items: start;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--cat-b) 38%, rgba(11, 16, 32, 0.2));
    border-radius: 8px;
    padding: 14px;
    background:
      radial-gradient(circle at 80% 18%, color-mix(in srgb, var(--cat-b) 28%, transparent), transparent 32%),
      linear-gradient(160deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.54)),
      var(--paper);
    color: var(--ink);
    text-align: left;
    transition:
      transform 260ms cubic-bezier(0.16, 1.1, 0.3, 1),
      border-color 260ms ease,
      filter 260ms ease,
      box-shadow 260ms ease;
    animation: token-enter 600ms cubic-bezier(0.16, 1.1, 0.3, 1) both;
    animation-delay: var(--delay);
  }

  .category-token::before {
    content: '';
    position: absolute;
    inset: -45% -70%;
    background: linear-gradient(115deg, transparent 42%, rgba(255, 255, 255, 0.56), transparent 58%);
    opacity: 0;
    transform: translateX(-36%);
    transition:
      opacity 220ms ease,
      transform 620ms ease;
  }

  .category-token::after {
    content: '';
    position: absolute;
    right: -20px;
    bottom: -20px;
    width: 78px;
    aspect-ratio: 1;
    border-radius: 22px;
    background: linear-gradient(135deg, var(--cat-a), var(--cat-b));
    opacity: 0.28;
    transform: rotate(18deg);
  }

  .category-token span {
    position: relative;
    z-index: 1;
    display: inline-grid;
    min-width: 44px;
    min-height: 28px;
    place-items: center;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--cat-a), var(--cat-b));
    color: var(--ink);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    font-weight: 900;
  }

  .category-token strong {
    position: relative;
    z-index: 1;
    font-size: clamp(1rem, 1.5vw, 1.22rem);
    line-height: 1;
    text-transform: uppercase;
  }

  .category-asset {
    position: relative;
    z-index: 1;
    width: clamp(58px, 7vw, 78px);
    aspect-ratio: 1;
    justify-self: end;
    object-fit: contain;
    filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.18));
    animation: category-idle 4.6s ease-in-out infinite;
  }

  .category-token em {
    position: relative;
    z-index: 1;
    color: rgba(11, 16, 32, 0.65);
    font-size: 0.74rem;
    font-style: normal;
    font-weight: 850;
    line-height: 1.25;
  }

  .category-token:hover {
    filter: saturate(1.18);
    transform: translateY(-7px) rotateX(3deg) rotateY(-3deg);
    box-shadow: 0 26px 34px rgba(0, 0, 0, 0.2);
  }

  .category-token:hover::before {
    opacity: 1;
    transform: translateX(42%);
  }

  .category-token.active {
    border-color: color-mix(in srgb, var(--cat-b) 68%, white);
    background:
      radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--cat-b) 36%, transparent), transparent 32%),
      linear-gradient(135deg, color-mix(in srgb, var(--cat-a) 56%, white), color-mix(in srgb, var(--cat-b) 48%, white)),
      var(--paper);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--cat-b) 42%, transparent), 0 24px 44px rgba(0, 0, 0, 0.2);
  }

  .motion-bubble .category-asset {
    animation-name: category-bubble;
  }

  .motion-glitch .category-asset {
    animation-name: category-glitch;
  }

  .motion-glow .category-asset {
    animation-name: category-glow;
  }

  .motion-kick .category-asset {
    animation-name: category-kick;
  }

  .dial-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .dial-control {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    gap: 10px;
    align-items: center;
    border: 1px solid rgba(230, 232, 239, 0.14);
    border-radius: 8px;
    padding: 12px;
    background: rgba(230, 232, 239, 0.06);
  }

  .dial-control button {
    display: grid;
    width: 44px;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgba(230, 232, 239, 0.26);
    border-radius: 50%;
    background: rgba(230, 232, 239, 0.1);
    color: var(--paper);
    font-size: 1.4rem;
    font-weight: 900;
    transition:
      transform 180ms ease,
      background 180ms ease;
  }

  .dial-control button:hover {
    background: var(--paper);
    color: var(--ink);
    transform: scale(1.08);
  }

  .dial-face {
    display: grid;
    min-height: 130px;
    place-items: center;
    border-radius: 50%;
    background:
      radial-gradient(circle, rgba(11, 16, 32, 0.92) 0 52%, transparent 53%),
      conic-gradient(from -90deg, var(--cyan) 0 var(--progress), rgba(230, 232, 239, 0.13) var(--progress) 360deg);
    box-shadow: inset 0 0 34px rgba(0, 0, 0, 0.34);
    text-align: center;
  }

  .dial-face span {
    align-self: end;
    color: var(--paper-dim);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .dial-face strong {
    align-self: start;
    font-size: 2.9rem;
    line-height: 1;
  }

  .toggle-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .flip-toggle {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    min-height: 74px;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 8px;
    padding: 10px;
    background: rgba(230, 232, 239, 0.06);
    color: var(--paper);
    text-align: left;
    transition:
      transform 220ms ease,
      background 220ms ease,
      border-color 220ms ease;
  }

  .flip-toggle span {
    position: relative;
    display: block;
    width: 64px;
    height: 42px;
    border: 1px solid rgba(230, 232, 239, 0.24);
    border-radius: 999px;
    background: rgba(11, 16, 32, 0.66);
  }

  .flip-toggle span::after {
    content: '';
    position: absolute;
    top: 5px;
    left: 6px;
    width: 30px;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--paper);
    transition:
      transform 220ms cubic-bezier(0.16, 1.1, 0.3, 1),
      background 220ms ease;
  }

  .flip-toggle strong {
    font-size: 1rem;
    line-height: 1;
    text-transform: uppercase;
  }

  .flip-toggle:hover {
    transform: translateY(-4px);
  }

  .flip-toggle.active {
    border-color: rgba(255, 213, 74, 0.5);
    background: rgba(255, 213, 74, 0.12);
  }

  .flip-toggle.active span::after {
    background: var(--yellow);
    transform: translateX(22px);
  }

  .question-lab {
    grid-area: lab;
    display: grid;
    gap: 18px;
    padding: 20px;
  }

  .lab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .lab-header h2 {
    margin-top: 8px;
    font-size: 2.7rem;
    line-height: 0.96;
    text-transform: uppercase;
  }

  .add-card {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    min-height: 64px;
    border: 1px solid rgba(230, 232, 239, 0.2);
    border-radius: 8px;
    padding: 10px 14px 10px 10px;
    background: var(--paper);
    color: var(--ink);
    font-weight: 950;
    text-align: left;
    text-transform: uppercase;
    transition:
      transform 220ms cubic-bezier(0.16, 1.1, 0.3, 1),
      box-shadow 220ms ease;
  }

  .add-card span {
    display: grid;
    width: 44px;
    aspect-ratio: 1;
    place-items: center;
    border-radius: 50%;
    background: var(--ink);
    color: var(--yellow);
    font-size: 1.6rem;
  }

  .add-card:hover {
    transform: translateY(-5px) rotate(-2deg);
    box-shadow: 0 24px 40px rgba(0, 0, 0, 0.26);
  }

  .draft-strip {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .draft-item {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 34px;
    flex: 0 0 178px;
    min-height: 62px;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 8px;
    background: rgba(230, 232, 239, 0.07);
    overflow: hidden;
    transition:
      transform 180ms ease,
      background 180ms ease,
      border-color 180ms ease;
  }

  .draft-select,
  .draft-delete {
    border: 0;
    background: transparent;
    color: var(--paper);
  }

  .draft-select {
    display: grid;
    min-width: 0;
    gap: 3px;
    align-content: center;
    padding: 10px;
    text-align: left;
  }

  .draft-delete {
    display: grid;
    min-height: 100%;
    place-items: center;
    border-left: 1px solid rgba(230, 232, 239, 0.12);
    color: rgba(230, 232, 239, 0.64);
    font-size: 1rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .draft-select span,
  .draft-select strong,
  .draft-select em {
    display: block;
    min-width: 0;
  }

  .draft-select span {
    font-size: 1.2rem;
    font-weight: 950;
  }

  .draft-select strong {
    color: var(--paper-dim);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    text-transform: uppercase;
  }

  .draft-select em {
    overflow: hidden;
    color: rgba(230, 232, 239, 0.54);
    font-size: 0.72rem;
    font-style: normal;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .draft-item:hover,
  .draft-item.active {
    border-color: rgba(57, 213, 255, 0.54);
    background: rgba(57, 213, 255, 0.14);
    transform: translateY(-3px);
  }

  .draft-item.ready .draft-select strong {
    color: var(--lime);
  }

  .draft-delete:hover,
  .draft-delete:focus-visible {
    background: rgba(229, 57, 53, 0.22);
    color: var(--paper);
  }

  .lab-status {
    display: flex;
    min-height: 58px;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    border: 1px solid rgba(230, 232, 239, 0.16);
    border-radius: 8px;
    padding: 10px 14px;
    background:
      linear-gradient(90deg, rgba(229, 57, 53, 0.12), transparent),
      rgba(230, 232, 239, 0.06);
    color: var(--paper);
  }

  .lab-status span,
  .lab-status strong {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .lab-status span {
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 999px;
    padding: 7px 10px;
    color: var(--paper-dim);
  }

  .lab-status strong {
    color: var(--yellow);
  }

  .lab-status.ready {
    border-color: rgba(54, 210, 124, 0.32);
    background:
      linear-gradient(90deg, rgba(54, 210, 124, 0.16), transparent),
      rgba(230, 232, 239, 0.06);
  }

  .lab-status.ready strong {
    color: var(--lime);
  }

  .active-draft-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: 1px solid rgba(230, 232, 239, 0.14);
    border-radius: 8px;
    padding: 10px;
    background: rgba(230, 232, 239, 0.055);
  }

  .active-draft-toolbar > span {
    color: var(--yellow);
    font-size: 0.74rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .active-draft-toolbar div {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .active-draft-toolbar button {
    min-height: 40px;
    border: 1px solid rgba(230, 232, 239, 0.2);
    border-radius: 8px;
    padding: 0 12px;
    background: rgba(230, 232, 239, 0.08);
    color: var(--paper);
    font-weight: 900;
    text-transform: uppercase;
    transition:
      transform 180ms ease,
      background 180ms ease,
      border-color 180ms ease;
  }

  .active-draft-toolbar button:hover {
    background: var(--paper);
    color: var(--ink);
    transform: translateY(-2px);
  }

  .active-draft-toolbar .danger {
    border-color: rgba(229, 57, 53, 0.38);
    color: #ffb7c5;
  }

  .active-draft-toolbar .danger:hover {
    background: var(--hot);
    color: white;
  }

  .builder-grid {
    display: grid;
    grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1fr);
    gap: 16px;
    align-items: stretch;
  }

  .question-field {
    grid-row: span 2;
    border: 1px solid rgba(230, 232, 239, 0.16);
    border-radius: 8px;
    padding: 16px;
    background:
      linear-gradient(145deg, rgba(255, 213, 74, 0.13), rgba(230, 232, 239, 0.045)),
      rgba(11, 16, 32, 0.34);
  }

  .question-field textarea {
    min-height: 250px;
    width: 100%;
    resize: vertical;
    border: 0;
    background: transparent;
    color: var(--paper);
    font-family: Sora, Inter, system-ui, sans-serif;
    font-size: 2.2rem;
    font-weight: 850;
    line-height: 1.05;
  }

  .answer-board {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .answer-slot {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    min-height: 82px;
    border: 1px solid rgba(230, 232, 239, 0.16);
    border-radius: 8px;
    padding: 10px;
    background: rgba(230, 232, 239, 0.07);
    transition:
      transform 180ms ease,
      border-color 180ms ease,
      background 180ms ease;
  }

  .answer-slot.correct {
    border-color: rgba(255, 213, 74, 0.58);
    background: rgba(255, 213, 74, 0.12);
  }

  .answer-slot:hover {
    transform: translateY(-3px);
  }

  .answer-key {
    display: grid;
    width: 52px;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgba(230, 232, 239, 0.24);
    border-radius: 50%;
    background: rgba(11, 16, 32, 0.52);
    color: var(--paper);
    font-family: 'JetBrains Mono', monospace;
    font-weight: 950;
  }

  .answer-slot.correct .answer-key {
    background: var(--yellow);
    color: var(--ink);
  }

  .answer-slot input,
  .metadata-board input {
    min-width: 0;
    width: 100%;
    border: 0;
    border-bottom: 1px solid rgba(230, 232, 239, 0.28);
    padding: 8px 0;
    background: transparent;
    color: var(--paper);
    font-weight: 850;
  }

  .metadata-board {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    align-items: end;
  }

  .metadata-board label {
    min-height: 94px;
    border: 1px solid rgba(230, 232, 239, 0.13);
    border-radius: 8px;
    padding: 12px;
    background: rgba(230, 232, 239, 0.055);
  }

  .image-preview {
    display: grid;
    gap: 8px;
    overflow: hidden;
    margin: 0;
    border: 1px solid rgba(230, 232, 239, 0.14);
    border-radius: 8px;
    background: rgba(11, 16, 32, 0.42);
  }

  .image-preview img {
    width: 100%;
    max-height: 260px;
    object-fit: cover;
  }

  .image-preview figcaption {
    padding: 0 12px 12px;
    color: var(--paper-dim);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .json-sync {
    border: 1px solid rgba(230, 232, 239, 0.14);
    border-radius: 8px;
    background: rgba(11, 16, 32, 0.36);
  }

  .json-sync summary {
    display: flex;
    min-height: 54px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 14px;
    cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .json-sync strong {
    color: var(--lime);
  }

  .json-sync pre {
    max-height: 260px;
    overflow: auto;
    margin: 0;
    border-top: 1px solid rgba(230, 232, 239, 0.12);
    padding: 14px;
    color: rgba(230, 232, 239, 0.78);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    line-height: 1.45;
  }

  .creator-footer {
    grid-area: footer;
    display: grid;
    gap: 12px;
    padding-bottom: 16px;
  }

  .creator-status {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .creator-status span {
    border: 1px solid rgba(230, 232, 239, 0.16);
    border-radius: 8px;
    padding: 8px 10px;
    background: rgba(230, 232, 239, 0.07);
    color: var(--paper-dim);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .error {
    color: var(--yellow);
    font-weight: 900;
  }

  @keyframes floor-shift {
    from {
      transform: translateX(-4%) skewY(-8deg);
    }
    to {
      transform: translateX(4%) skewY(-10deg);
    }
  }

  @keyframes ribbon-glide {
    from {
      translate: -2% -8%;
    }
    to {
      translate: 4% 8%;
    }
  }

  @keyframes dust-tick {
    50% {
      background-position:
        10% 24%,
        70% 15%,
        58% 80%;
    }
  }

  @keyframes meter-pop {
    from {
      transform: scaleY(0.55);
      filter: hue-rotate(0deg);
    }
    to {
      transform: scaleY(1);
      filter: hue-rotate(38deg);
    }
  }

  @keyframes scanline {
    from {
      background-position: -140% 0, 0 0;
    }
    to {
      background-position: 140% 0, 0 70px;
    }
  }

  @keyframes float-card {
    50% {
      translate: 0 -16px;
    }
  }

  @keyframes token-enter {
    from {
      opacity: 0;
      transform: translateY(22px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes category-idle {
    50% {
      transform: translate3d(0, -6px, 0);
    }
  }

  @keyframes category-bubble {
    50% {
      transform: translate3d(0, -7px, 0) scale(1.04);
    }
  }

  @keyframes category-glitch {
    0%,
    88%,
    100% {
      transform: translate3d(0, 0, 0);
    }
    90% {
      transform: translate3d(3px, -1px, 0);
    }
    92% {
      transform: translate3d(-2px, 1px, 0);
    }
  }

  @keyframes category-glow {
    50% {
      filter: drop-shadow(0 0 14px color-mix(in srgb, var(--cat-b) 72%, transparent));
      transform: translate3d(0, -4px, 0);
    }
  }

  @keyframes category-kick {
    0%,
    78%,
    100% {
      transform: translate3d(0, 0, 0) rotate(0);
    }
    84% {
      transform: translate3d(5px, -4px, 0) rotate(4deg);
    }
  }

  @media (max-width: 1180px) {
    .party-stage {
      grid-template-columns: 1fr;
      grid-template-areas:
        'hero'
        'modes'
        'live'
        'controls'
        'lab'
        'footer';
    }

    .hero {
      min-height: auto;
    }

    .live-scene {
      position: relative;
      top: auto;
      min-height: 620px;
    }

    .screen-stack {
      transform: rotateY(-4deg) rotateX(3deg);
    }
  }

  @media (max-width: 860px) {
    .party-page {
      padding: 16px;
    }

    .hero {
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: 4.4rem;
    }

    .launch-pod {
      justify-items: start;
      margin-top: 0;
      transform: none;
    }

    .control-table,
    .builder-grid,
    .metadata-board {
      grid-template-columns: 1fr;
    }

    .category-console,
    .tempo-console {
      grid-column: auto;
    }

    .category-deck {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .mode-showcase {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .room-screen {
      min-height: 540px;
    }

    .room-screen h2 {
      font-size: 3.2rem;
    }

    .score-a {
      left: 8px;
    }

    .score-b {
      right: 8px;
    }
  }

  @media (max-width: 620px) {
    .party-page {
      padding: 12px;
    }

    .party-stage {
      gap: 14px;
    }

    h1 {
      font-size: 3.25rem;
    }

    .brand-line,
    .panel-tag,
    .screen-kicker {
      font-size: 0.68rem;
    }

    .hero-marquee {
      min-height: auto;
      flex-wrap: wrap;
      padding: 8px;
    }

    .hero-marquee span {
      border: 1px solid rgba(230, 232, 239, 0.12);
      padding: 7px 9px;
      font-size: 0.78rem;
    }

    .launch-button {
      width: 178px;
    }

    .launch-button span {
      font-size: 1.55rem;
    }

    .launch-button strong {
      font-size: 0.94rem;
    }

    .live-scene {
      min-height: 560px;
    }

    .room-screen {
      min-height: 490px;
      padding: 20px;
    }

    .room-screen h2 {
      font-size: 2.4rem;
    }

    .question-broadcast strong {
      font-size: 1.2rem;
    }

    .floating-score {
      width: min(230px, 82%);
    }

    .score-a {
      top: 454px;
    }

    .score-b {
      top: 112px;
    }

    .theme-rack,
    .dial-grid,
    .toggle-row,
    .answer-board,
    .category-deck {
      grid-template-columns: 1fr;
    }

    .mode-showcase {
      display: flex;
      overflow-x: auto;
      padding-bottom: 6px;
      scroll-snap-type: x mandatory;
    }

    .mode-showcase button {
      flex: 0 0 min(78vw, 260px);
      scroll-snap-align: start;
    }

    .quick-actions,
    .quick-join {
      display: grid;
      grid-template-columns: 1fr;
    }

    .name-field input,
    .question-field textarea {
      font-size: 1.8rem;
    }

    .lab-header {
      display: grid;
    }

    .lab-header h2 {
      font-size: 2rem;
    }

    .add-card {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .party-page *,
    .party-page::before,
    .party-page::after {
      transition: none !important;
      animation: none !important;
      scroll-behavior: auto !important;
    }
  }
</style>
