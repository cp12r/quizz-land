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
        <span aria-hidden="true">{$soundMuted ? '🔇' : '🔊'}</span>
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

    <section class="card board">
      <div class="board-head">
        <div>
          <p class="mono">Scores</p>
          <h2>Résultats</h2>
        </div>
        <span class="total mono">{totalScore} pts</span>
      </div>

      {#each resultsData as player, index}
        <article
          class:leader={index === 0}
          class="row"
          aria-label={`${index + 1}e place : ${player.name}, ${revealed ? `${player.score} points` : 'score masqué'}`}
          style={`--row-delay:${Math.min(index, 10) * 38}ms;`}
        >
          <span class="rank-badge mono">{index + 1}</span>
          <strong>{player.name}</strong>
          <span class:masked={!revealed} class="row-score mono" aria-hidden={!revealed}>{player.score} pts</span>
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
    --ink: #0b1020;
    --paper: #e6e8ef;
    --paper-dim: rgba(230, 232, 239, 0.72);
    --line: rgba(230, 232, 239, 0.18);
    --hot: #e53935;
    --cyan: #39d5ff;
    --yellow: #ffd54a;
    position: relative;
    isolation: isolate;
    overflow: hidden;
    background:
      linear-gradient(122deg, rgba(229, 57, 53, 0.16), transparent 34%),
      linear-gradient(248deg, rgba(57, 213, 255, 0.15), transparent 38%),
      conic-gradient(from 120deg at 50% 16%, #171e31, #0b1020, #0f0e12, #212a45, #0b1020);
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
    display: grid;
    width: 48px;
    min-height: 46px;
    place-items: center;
    border: 1px solid rgba(230, 232, 239, 0.22);
    border-radius: 8px;
    background: rgba(230, 232, 239, 0.08);
    color: var(--paper);
    padding: 0;
    font-size: 1.35rem;
    font-weight: 900;
    box-shadow: 0 16px 38px rgba(0, 0, 0, 0.18);
  }

  .board {
    display: grid;
    gap: 12px;
    border: 1px solid rgba(230, 232, 239, 0.16);
    border-radius: 8px;
    background:
      linear-gradient(135deg, rgba(230, 232, 239, 0.09), rgba(230, 232, 239, 0.035)),
      rgba(11, 16, 32, 0.72);
    color: var(--paper);
    padding: 20px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.24);
  }

  .total {
    border: 1px solid rgba(255, 213, 74, 0.22);
    border-radius: 8px;
    background: rgba(255, 213, 74, 0.1);
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
    border: 1px solid rgba(230, 232, 239, 0.12);
    border-radius: 8px;
    background: rgba(230, 232, 239, 0.07);
    padding: 10px 12px;
    animation: rise-in 320ms var(--ease-pop) both;
    animation-delay: var(--row-delay, 0ms);
    transition:
      border-color 180ms ease,
      background 180ms ease,
      transform 180ms ease;
  }

  .row:hover {
    border-color: rgba(255, 213, 74, 0.26);
    transform: translateY(-2px);
  }

  .leader {
    background: linear-gradient(135deg, rgba(229, 57, 53, 0.16), rgba(255, 213, 74, 0.12));
  }

  .rank-badge {
    display: grid;
    min-height: 36px;
    place-items: center;
    border-radius: 8px;
    background: rgba(230, 232, 239, 0.1);
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
    border: 1px solid rgba(230, 232, 239, 0.14);
    border-radius: 8px;
    background: rgba(230, 232, 239, 0.07);
    color: var(--paper-dim);
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 900;
  }

  .actions {
    flex-wrap: wrap;
    justify-content: flex-start;
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

</style>
