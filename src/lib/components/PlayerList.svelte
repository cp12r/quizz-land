<script>
  export let players = [];
  export let hostId = null;
  export let maskScores = false;
  export let title = 'Joueurs';

  $: rankedPlayers = [...players].sort((a, b) => b.score - a.score);

  function rankLabel(index) {
    if (index === 0) return '1er';
    if (index === 1) return '2e';
    if (index === 2) return '3e';
    return String(index + 1);
  }
</script>

<section class="card players" aria-label="Joueurs">
  <div class="heading">
    <h2>{title}</h2>
    <span class="count mono">{players.length}</span>
  </div>

  {#if players.length}
    <ol>
      {#each rankedPlayers as player, index}
        <li
          class:podium={index < 3}
          aria-label={maskScores ? `${player.name}, rang et score masqués` : undefined}
          style={`--row-delay:${Math.min(index, 8) * 42}ms;`}
        >
          <span class:masked={maskScores} class="rank mono" aria-hidden={maskScores}>
            {rankLabel(index)}
          </span>
          {#if maskScores}<span class="sr-only">Rang masqué</span>{/if}
          <strong>{player.name}</strong>
          {#if player.id === hostId}<small>Host</small>{/if}
          <span class:masked={maskScores} class="score mono" aria-hidden={maskScores}>
            {maskScores ? '---' : player.score}
          </span>
          {#if maskScores}<span class="sr-only">Score masqué</span>{/if}
        </li>
      {/each}
    </ol>
  {:else}
    <p>En attente.</p>
  {/if}
</section>

<style>
  .players {
    border-radius: 8px;
    padding: 20px;
    background:
      linear-gradient(135deg, rgba(255, 250, 240, 0.09), rgba(255, 250, 240, 0.035)),
      rgba(23, 21, 27, 0.7);
    color: #fffaf0;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.24);
  }

  .heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  h2 {
    margin: 0;
    color: #fffaf0;
    font-size: 20px;
    text-transform: uppercase;
  }

  .count {
    display: grid;
    min-width: 34px;
    min-height: 30px;
    place-items: center;
    border: 1px solid rgba(255, 250, 240, 0.18);
    border-radius: 8px;
    background: rgba(255, 250, 240, 0.1);
    color: var(--color-yellow);
    font-size: 13px;
    font-weight: 900;
  }

  ol {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 10px;
    min-height: 54px;
    border: 1px solid rgba(255, 250, 240, 0.12);
    border-radius: 8px;
    background: rgba(255, 250, 240, 0.07);
    padding: 8px 12px;
    animation: rise-in 300ms var(--ease-pop) both;
    animation-delay: var(--row-delay, 0ms);
    transition:
      border-color 180ms ease,
      background 180ms ease,
      transform 180ms ease;
  }

  li:hover {
    border-color: rgba(255, 209, 102, 0.28);
    transform: translateY(-2px);
  }

  .podium {
    background: linear-gradient(135deg, rgba(255, 209, 102, 0.16), rgba(255, 250, 240, 0.08));
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.16);
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    display: inline-flex;
    min-height: 24px;
    align-items: center;
    border: 1px solid rgba(67, 232, 255, 0.24);
    border-radius: 8px;
    background: rgba(67, 232, 255, 0.1);
    color: var(--color-cyan);
    padding: 0 8px;
    font-weight: 900;
    font-size: 12px;
  }

  .rank {
    display: grid;
    min-height: 34px;
    place-items: center;
    border-radius: 8px;
    background: rgba(255, 250, 240, 0.1);
    color: var(--color-yellow);
    font-size: 12px;
    font-weight: 900;
  }

  .score {
    min-width: 54px;
    color: #fffaf0;
    text-align: right;
    font-weight: 900;
  }

  .masked {
    color: var(--color-yellow);
    filter: blur(4px);
    opacity: 0.72;
    text-shadow: 0 0 14px rgba(255, 209, 102, 0.46);
    transform: translateZ(0);
    user-select: none;
  }

  p {
    margin: 0;
    color: rgba(255, 250, 240, 0.72);
    font-weight: 800;
  }

  @media (max-width: 520px) {
    li {
      grid-template-columns: 38px minmax(0, 1fr) auto;
    }

    small {
      display: none;
    }
  }
</style>
