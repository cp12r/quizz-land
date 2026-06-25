<script>
  export let players = [];
  export let hostId = null;
</script>

<section class="card players" aria-label="Joueurs">
  <h2>Joueurs</h2>
  {#if players.length}
    <ol>
      {#each [...players].sort((a, b) => b.score - a.score) as player, index}
        <li>
          <span class="rank mono">{index + 1}</span>
          <strong>{player.name}</strong>
          {#if player.id === hostId}<small>Host</small>{/if}
          <span class="score mono">{player.score}</span>
        </li>
      {/each}
    </ol>
  {:else}
    <p>Aucun joueur connecte.</p>
  {/if}
</section>

<style>
  .players {
    padding: 20px;
  }

  h2 {
    margin: 0 0 16px;
    font-size: 20px;
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
    grid-template-columns: 32px 1fr auto auto;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    border-radius: 8px;
    background: var(--gray-50);
    padding: 8px 10px;
  }

  small {
    color: var(--color-blue);
    font-weight: 700;
  }

  .rank,
  .score {
    color: var(--gray-600);
  }
</style>
