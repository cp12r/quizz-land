<script>
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import { pageTitle, siteMeta } from '$lib/config/site.js';
  import { initSound, playSound, soundMuted, toggleSound } from '$lib/utils/sound.js';
  import { applyTheme } from '$lib/utils/theme.js';

  export let data;

  let revealed = false;
  let copied = false;

  $: exportText = JSON.stringify({ room: data.room.id, config: data.room.config, results: data.results }, null, 2);
  $: winner = data.results[0];
  $: topThree = data.results.slice(0, 3);
  $: totalScore = data.results.reduce((sum, player) => sum + player.score, 0);
  $: title = pageTitle(winner ? `${winner.name} remporte le quiz` : 'Classement final');
  $: description = `Classement final du salon ${data.room.id} sur ${siteMeta.name}. Résultats temporaires disponibles après la partie.`;

  async function copyResults() {
    await navigator.clipboard.writeText(exportText);
    copied = true;
    playSound('ui');
    setTimeout(() => {
      copied = false;
    }, 1400);
  }

  onMount(() => {
    initSound();
    applyTheme(data.room.config?.themeId);
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

<main class="page">
  <section class="shell results">
    <header class="hero">
      <div>
        <p class="mono">{data.room.id}</p>
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

    <section class:revealed class="podium" aria-label="Podium final" aria-live="polite">
      {#each topThree as player, index}
        <article class={`place place-${index + 1}`} aria-label={`${index + 1}e place : ${player.name}`}>
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

      {#each data.results as player, index}
        <article class:leader={index === 0} class="row">
          <span class="rank-badge mono">{index + 1}</span>
          <strong>{player.name}</strong>
          <span class:masked={!revealed} class="row-score mono">{player.score} pts</span>
        </article>
      {/each}
    </section>

    {#if data.room.deleteAfter}
      <p class="retention mono">Données temporaires jusqu’à {new Date(data.room.deleteAfter).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
    {/if}

    <div class="actions">
      <Button href="/">Nouveau salon</Button>
      <Button variant="secondary" onclick={copyResults}>{copied ? 'JSON copié' : 'Exporter JSON'}</Button>
    </div>
  </section>
</main>

<style>
  .results {
    display: grid;
    max-width: 920px;
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
    color: var(--color-accent);
    font-weight: 900;
  }

  h1 {
    font-size: 3.4rem;
  }

  h2 {
    font-size: 2rem;
  }

  .sound-toggle {
    min-height: 42px;
    border: 1px solid var(--border-soft);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    color: var(--color-ink);
    padding: 0 14px;
    font-weight: 900;
    box-shadow: var(--shadow-soft);
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
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-card);
    background:
      linear-gradient(135deg, rgba(255, 209, 102, 0.28), transparent 48%),
      rgba(255, 255, 255, 0.78);
    padding: 18px;
    box-shadow: var(--shadow-card);
    animation: rise-in 380ms var(--ease-pop) both;
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
      linear-gradient(135deg, rgba(255, 209, 102, 0.42), rgba(255, 255, 255, 0.76)),
      white;
  }

  .place-2 {
    min-height: 185px;
  }

  .rank {
    color: var(--color-accent);
    font-weight: 900;
  }

  .place strong {
    overflow-wrap: anywhere;
    font-size: 1.45rem;
  }

  .score {
    justify-self: start;
    border-radius: 999px;
    background: var(--color-ink);
    color: white;
    padding: 8px 12px;
    font-weight: 900;
  }

  .board {
    display: grid;
    gap: 12px;
    padding: 20px;
  }

  .total {
    border-radius: 999px;
    background: var(--surface-tint);
    color: var(--color-accent);
    padding: 8px 12px;
    font-weight: 900;
  }

  .row {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    min-height: 58px;
    border: 1px solid rgba(21, 19, 31, 0.06);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.70);
    padding: 10px 12px;
    animation: rise-in 280ms var(--ease-pop) both;
  }

  .leader {
    background: linear-gradient(135deg, rgba(255, 79, 121, 0.12), rgba(255, 209, 102, 0.18));
  }

  .rank-badge {
    display: grid;
    min-height: 36px;
    place-items: center;
    border-radius: 999px;
    background: var(--color-ink);
    color: white;
    font-weight: 900;
  }

  .row strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row-score {
    font-weight: 900;
  }

  .masked {
    filter: blur(6px);
    opacity: 0.52;
  }

  .retention {
    justify-self: start;
    margin: 0;
    border-radius: 999px;
    background: rgba(21, 19, 31, 0.08);
    color: var(--color-muted);
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
</style>
