<script>
  import Button from '$lib/components/Button.svelte';

  export let data;

  $: exportText = JSON.stringify({ room: data.room.id, results: data.results }, null, 2);

  async function copyResults() {
    await navigator.clipboard.writeText(exportText);
  }
</script>

<main class="page">
  <section class="shell results">
    <header>
      <p class="mono">{data.room.id}</p>
      <h1>Classement final</h1>
    </header>

    <section class="card board">
      {#each data.results as player, index}
        <article class:podium={index < 3}>
          <span class="rank mono">{index + 1}</span>
          <strong>{player.name}</strong>
          <span class="mono">{player.score} pts</span>
        </article>
      {/each}
    </section>

    <div class="actions">
      <Button href="/">Nouvelle room</Button>
      <Button variant="secondary" onclick={copyResults}>Exporter JSON</Button>
    </div>
  </section>
</main>

<style>
  .results {
    display: grid;
    gap: 24px;
    max-width: 760px;
  }

  header p,
  h1 {
    margin: 0;
  }

  header p {
    color: var(--color-accent);
    font-weight: 700;
  }

  h1 {
    font-size: clamp(32px, 6vw, 56px);
  }

  .board {
    display: grid;
    gap: 10px;
    padding: 18px;
  }

  article {
    display: grid;
    grid-template-columns: 48px 1fr auto;
    align-items: center;
    min-height: 56px;
    border-radius: 8px;
    background: var(--gray-50);
    padding: 10px 14px;
  }

  .podium {
    background: #fff4f6;
  }

  .rank {
    color: var(--color-accent);
    font-weight: 700;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
</style>
