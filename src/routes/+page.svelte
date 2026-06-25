<script>
  import Button from '$lib/components/Button.svelte';
  import { createRoom } from '$lib/utils/api.js';

  export let data;

  let name = '';
  let selectedCategories = data.categories.slice(0, 3);
  let questionCount = 8;
  let timePerQuestion = 30;
  let bonusTimer = true;
  let error = '';

  async function submit() {
    error = '';
    try {
      const { room } = await createRoom({ name, categories: selectedCategories, questionCount, timePerQuestion, bonusTimer });
      location.href = `/room/${room.id}`;
    } catch (err) {
      error = err.message;
    }
  }

  function toggleCategory(category) {
    selectedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];
  }
</script>

<main class="page">
  <section class="shell home">
    <div class="intro">
      <p class="mono">QUIZZ LAND</p>
      <h1>Cree une room, invite tes amis, lance la partie.</h1>
    </div>

    <form class="card creator" on:submit|preventDefault={submit}>
      <label class="field">
        <span>Nom de la room</span>
        <input bind:value={name} maxlength="36" placeholder="Auto si vide" />
      </label>

      <fieldset>
        <legend>Categories</legend>
        <div class="chips">
          {#each data.categories as category}
            <button type="button" class:active={selectedCategories.includes(category)} on:click={() => toggleCategory(category)}>
              {category}
            </button>
          {/each}
        </div>
      </fieldset>

      <label class="field">
        <span>Nombre de questions: <b class="mono">{questionCount}</b></span>
        <input type="range" min="5" max="50" bind:value={questionCount} />
      </label>

      <label class="field">
        <span>Temps par question: <b class="mono">{timePerQuestion}s</b></span>
        <input type="range" min="10" max="120" step="5" bind:value={timePerQuestion} />
      </label>

      <label class="toggle">
        <input type="checkbox" bind:checked={bonusTimer} />
        Bonus temps
      </label>

      {#if error}<p class="error">{error}</p>{/if}
      <Button type="submit">Creer la room</Button>
    </form>
  </section>
</main>

<style>
  .home {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 440px);
    gap: 32px;
    align-items: center;
    min-height: calc(100vh - 64px);
  }

  .intro p {
    color: var(--color-accent);
    font-weight: 700;
  }

  h1 {
    max-width: 720px;
    margin: 0;
    font-size: clamp(32px, 7vw, 64px);
  }

  .creator {
    display: grid;
    gap: 18px;
    padding: 24px;
  }

  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
  }

  legend {
    margin-bottom: 8px;
    color: var(--gray-600);
    font-size: 14px;
    font-weight: 700;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chips button {
    min-height: 40px;
    border: 1px solid var(--gray-200);
    border-radius: 999px;
    background: white;
    padding: 0 14px;
  }

  .chips .active {
    border-color: var(--color-blue);
    background: var(--color-blue);
    color: white;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    font-weight: 700;
  }

  .error {
    color: var(--color-danger);
    font-weight: 700;
  }

  @media (max-width: 760px) {
    .home {
      grid-template-columns: 1fr;
      align-items: start;
    }
  }
</style>
