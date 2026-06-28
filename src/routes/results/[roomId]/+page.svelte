<script>
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import { pageTitle, siteMeta } from '$lib/config/site.js';
  import SceneBackground3D from '$lib/components/SceneBackground3D.svelte';
  import ScoreboardStage3D from '$lib/components/ScoreboardStage3D.svelte';
  import { initSound, playSound, soundMuted, toggleSound } from '$lib/utils/sound.js';
  import { applyTheme } from '$lib/utils/theme.js';

  export let data;

  let revealed = false;
  let copied = false;
  let roomData = data.room;
  let resultsData = data.results;

  $: exportText = JSON.stringify({ room: roomData.id, config: roomData.config, results: resultsData }, null, 2);
  $: winner = resultsData[0];
  $: topThree = resultsData.slice(0, 3);
  $: totalScore = resultsData.reduce((sum, player) => sum + player.score, 0);
  $: title = pageTitle(winner ? `${winner.name} remporte le quiz` : 'Classement final');
  $: description = `Classement final du salon ${roomData.id} sur ${siteMeta.name}. Résultats temporaires disponibles après la partie.`;

  function restoreResultBackup() {
    if (typeof sessionStorage === 'undefined' || resultsData.length) return;

    const raw = sessionStorage.getItem(`quizz-results-${roomData.id}`);
    if (!raw) return;

    try {
      const backup = JSON.parse(raw);
      if (!Array.isArray(backup.results) || !backup.results.length) return;
      roomData = { ...backup.room, id: backup.room?.id || roomData.id };
      resultsData = backup.results;
    } catch {
      sessionStorage.removeItem(`quizz-results-${roomData.id}`);
    }
  }

  async function copyResults() {
    await navigator.clipboard.writeText(exportText);
    copied = true;
    playSound('ui');
    setTimeout(() => {
      copied = false;
    }, 1400);
  }

  onMount(() => {
    restoreResultBackup();
    initSound();
    applyTheme(roomData.config?.themeId);
    playSound('reveal');
    setTimeout(() => {
      revealed = true;
      playSound('victory');
    }, 650);
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="noindex,follow" />
  <meta property="og:site_name" content={siteMeta.name} />
  <meta property="og:locale" content={siteMeta.locale} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
</svelte:head>

<main class="page results-page">
  <SceneBackground3D variant="results" intensity={0.4} />

  <section class="shell results">
    <header class="hero">
      <div>
        <p class="mono">{roomData.id}</p>
        <h1>{winner ? `${winner.name} remporte le quiz` : 'Classement final'}</h1>
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
    </header>

    {#if resultsData.length}
      <ScoreboardStage3D results={resultsData} {revealed} />
    {:else}
      <section class="card board empty-results" role="status">
        <div class="board-head">
          <div>
            <p class="mono">Scores</p>
            <h2>Résultats indisponibles</h2>
          </div>
        </div>
        <p>La partie est terminée, mais le classement n'a pas pu être récupéré sur cet appareil.</p>
      </section>
    {/if}

    <section class:revealed class="podium" aria-label="Podium final" aria-live="polite">
      {#each topThree as player, index}
        <article class:winner={index === 0} class={`place place-${index + 1}`} aria-label={`${index + 1}e place : ${player.name}`}>
          <span class="rank mono">#{index + 1}</span>
          <strong>{player.name}</strong>
          <span class:masked={!revealed} class="score mono">{player.score} pts</span>
        </article>
      {/each}
    </section>

    <section class="card board">
      <div class="board-head">
        <div>
          <p class="mono">Scores</p>
          <h2>Résultats</h2>
        </div>
        <span class="total mono">{totalScore} pts</span>
      </div>

      {#each resultsData as player, index}
        <article class:leader={index === 0} class="row">
          <span class="rank-badge mono">{index + 1}</span>
          <strong>{player.name}</strong>
          <span class:masked={!revealed} class="row-score mono">{player.score} pts</span>
        </article>
      {/each}
    </section>

    {#if roomData.deleteAfter}
      <p class="retention mono">Données temporaires jusqu’à {new Date(roomData.deleteAfter).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
    {/if}

    <div class="actions">
      <Button href="/">Nouveau salon</Button>
      <Button variant="secondary" onclick={copyResults}>{copied ? 'JSON copié' : 'Exporter JSON'}</Button>
    </div>
  </section>
</main>

<style>
  .results-page {
    --ink: #17151b;
    --paper: #fffaf0;
    --paper-dim: rgba(255, 250, 240, 0.72);
    --line: rgba(255, 250, 240, 0.18);
    --hot: #ff3e8a;
    --cyan: #43e8ff;
    --yellow: #f8f34a;
    position: relative;
    isolation: isolate;
    overflow: hidden;
    background:
      linear-gradient(122deg, rgba(255, 62, 138, 0.16), transparent 34%),
      linear-gradient(248deg, rgba(67, 232, 255, 0.15), transparent 38%),
      conic-gradient(from 120deg at 50% 16%, #25202d, #17151b, #0f0e12, #221926, #17151b);
    color: var(--paper);
  }

  .results-page::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.034) 0 1px, transparent 1px 78px),
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.024) 0 1px, transparent 1px 78px);
    opacity: 0.46;
    mask-image: linear-gradient(to bottom, black 0%, transparent 84%);
  }

  .results {
    position: relative;
    z-index: 1;
    display: grid;
    max-width: 1040px;
    gap: 24px;
  }

  .hero,
  .board-head,
  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .hero p,
  .hero h1,
  .board-head p,
  .board-head h2 {
    margin: 0;
  }

  .hero p,
  .board-head p {
    color: var(--yellow);
    font-weight: 900;
    text-transform: uppercase;
  }

  h1 {
    color: var(--paper);
    font-size: clamp(2.3rem, 7svw, 5.2rem);
    line-height: 0.92;
    text-transform: uppercase;
  }

  h2 {
    color: var(--paper);
    font-size: 2rem;
    text-transform: uppercase;
  }

  .sound-toggle {
    min-height: 46px;
    border: 1px solid rgba(255, 250, 240, 0.22);
    border-radius: 8px;
    background: rgba(255, 250, 240, 0.08);
    color: var(--paper);
    padding: 0 14px;
    font-weight: 900;
    box-shadow: 0 16px 38px rgba(0, 0, 0, 0.18);
    text-transform: uppercase;
  }

  .podium {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    align-items: end;
  }

  .place {
    position: relative;
    overflow: hidden;
    display: grid;
    min-height: 170px;
    align-content: end;
    gap: 10px;
    border: 1px solid rgba(255, 250, 240, 0.16);
    border-radius: 8px;
    background:
      linear-gradient(135deg, rgba(255, 209, 102, 0.18), rgba(255, 250, 240, 0.06)),
      rgba(23, 21, 27, 0.66);
    color: var(--paper);
    padding: 18px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.24);
    animation: podium-in 420ms cubic-bezier(0.16, 1.1, 0.3, 1) both;
  }

  .place::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.38), transparent);
    transform: translateX(-120%);
  }

  .revealed .place::before {
    animation: shimmer 900ms ease forwards;
  }

  .place-1 {
    min-height: 220px;
    background:
      linear-gradient(135deg, rgba(248, 243, 74, 0.32), rgba(255, 62, 138, 0.14)),
      rgba(23, 21, 27, 0.78);
    box-shadow:
      0 32px 80px rgba(0, 0, 0, 0.32),
      0 0 0 1px rgba(248, 243, 74, 0.18) inset;
  }

  .place-2 {
    min-height: 185px;
  }

  .rank {
    color: var(--yellow);
    font-weight: 900;
  }

  .place strong {
    overflow-wrap: anywhere;
    font-size: 1.45rem;
    text-transform: uppercase;
  }

  .score {
    justify-self: start;
    border: 1px solid rgba(255, 250, 240, 0.18);
    border-radius: 8px;
    background: rgba(255, 250, 240, 0.1);
    color: var(--paper);
    padding: 8px 12px;
    font-weight: 900;
  }

  .board {
    display: grid;
    gap: 12px;
    border: 1px solid rgba(255, 250, 240, 0.16);
    border-radius: 8px;
    background:
      linear-gradient(135deg, rgba(255, 250, 240, 0.09), rgba(255, 250, 240, 0.035)),
      rgba(23, 21, 27, 0.72);
    color: var(--paper);
    padding: 20px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.24);
  }

  .total {
    border: 1px solid rgba(248, 243, 74, 0.22);
    border-radius: 8px;
    background: rgba(248, 243, 74, 0.1);
    color: var(--yellow);
    padding: 8px 12px;
    font-weight: 900;
  }

  .row {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    min-height: 58px;
    border: 1px solid rgba(255, 250, 240, 0.12);
    border-radius: 8px;
    background: rgba(255, 250, 240, 0.07);
    padding: 10px 12px;
    animation: rise-in 280ms var(--ease-pop) both;
  }

  .leader {
    background: linear-gradient(135deg, rgba(255, 79, 121, 0.16), rgba(255, 209, 102, 0.12));
  }

  .rank-badge {
    display: grid;
    min-height: 36px;
    place-items: center;
    border-radius: 8px;
    background: rgba(255, 250, 240, 0.1);
    color: var(--yellow);
    font-weight: 900;
  }

  .row strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row-score {
    color: var(--paper);
    font-weight: 900;
  }

  .masked {
    filter: blur(6px);
    opacity: 0.52;
  }

  .retention {
    justify-self: start;
    margin: 0;
    border: 1px solid rgba(255, 250, 240, 0.14);
    border-radius: 8px;
    background: rgba(255, 250, 240, 0.07);
    color: var(--paper-dim);
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 900;
  }

  .actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .winner {
    animation:
      podium-in 420ms cubic-bezier(0.16, 1.1, 0.3, 1) both,
      winner-breathe 1900ms ease-in-out 900ms infinite;
  }

  .winner::after {
    content: '';
    position: absolute;
    inset: 10px;
    border: 1px solid rgba(248, 243, 74, 0.34);
    opacity: 0;
  }

  .revealed .winner::after {
    animation: victory-frame 1400ms ease-out both;
  }

  @keyframes podium-in {
    from {
      opacity: 0;
      transform: translateY(18px) rotateX(-10deg);
    }
    to {
      opacity: 1;
      transform: translateY(0) rotateX(0);
    }
  }

  @keyframes winner-breathe {
    50% {
      transform: translateY(-6px) rotate(-0.6deg);
    }
  }

  @keyframes victory-frame {
    20% {
      opacity: 1;
      transform: scale(0.98);
    }
    100% {
      opacity: 0;
      transform: scale(1.08);
    }
  }

  @media (max-width: 720px) {
    .hero,
    .board-head {
      align-items: start;
      display: grid;
      grid-template-columns: 1fr;
    }

    h1 {
      font-size: 2.45rem;
    }

    .podium {
      grid-template-columns: 1fr;
    }

    .place,
    .place-1,
    .place-2 {
      min-height: 140px;
    }

    .sound-toggle {
      width: 100%;
    }
  }

  @media (max-width: 520px) {
    h1 {
      font-size: 2rem;
    }

    .row {
      grid-template-columns: 38px minmax(0, 1fr);
    }

    .row-score {
      grid-column: 2;
      justify-self: start;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .winner,
    .place,
    .revealed .winner::after {
      animation: none;
    }
  }
</style>
