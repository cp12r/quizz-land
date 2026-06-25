<script>
  import Button from './Button.svelte';

  export let question = null;
  export let selected = null;
  export let locked = false;
  export let onAnswer = () => {};
</script>

<section class="card question-card">
  {#if question}
    <p class="mono eyebrow">{question.category}</p>
    <h1>{question.text}</h1>
    <div class="answers">
      {#each question.answers as answer, index}
        <Button variant={selected === index ? 'primary' : 'secondary'} disabled={locked} onclick={() => onAnswer(index)}>
          <span class="mono">{String.fromCharCode(65 + index)}</span>
          {answer}
        </Button>
      {/each}
    </div>
  {:else}
    <h1>En attente de la prochaine question</h1>
  {/if}
</section>

<style>
  .question-card {
    display: grid;
    gap: 20px;
    padding: clamp(20px, 4vw, 32px);
  }

  .eyebrow {
    margin: 0;
    color: var(--color-accent);
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(24px, 5vw, 48px);
  }

  .answers {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  @media (max-width: 640px) {
    .answers {
      grid-template-columns: 1fr;
    }
  }
</style>
