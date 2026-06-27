<script>
  export let question = null;
  export let selected = null;
  export let locked = false;
  export let feedback = null;
  export let onAnswer = () => {};

  $: hasImage = Boolean(question?.image);
</script>

<section class="card question-card">
  {#if question}
    <div class="question-head">
      <p class="mono eyebrow">{question.category}</p>
      <h1>{question.text}</h1>
    </div>

    {#if hasImage}
      <figure>
        <img src={question.image} alt={question.imageAlt || `Illustration de la question : ${question.text}`} loading="eager" />
      </figure>
    {/if}

    <div class="answers" class:locked>
      {#each question.answers as answer, index}
        <button
          type="button"
          class:selected={selected === index}
          disabled={locked}
          on:click={() => onAnswer(index)}
          aria-label={`Réponse ${String.fromCharCode(65 + index)} : ${answer}`}
        >
          <span class="key mono">{String.fromCharCode(65 + index)}</span>
          <span>{answer}</span>
        </button>
      {/each}
    </div>

    {#if locked}
      <p class:correct={feedback?.correct} class:wrong={feedback && !feedback.correct} class="feedback mono">
        {#if feedback}
          {feedback.correct ? `+${feedback.points} pts` : 'Pas cette fois'}
        {:else}
          Réponse verrouillée
        {/if}
      </p>
    {/if}
  {:else}
    <div class="empty">
      <p class="mono eyebrow">Suite</p>
      <h1>En attente de la prochaine question</h1>
    </div>
  {/if}
</section>

<style>
  .question-card {
    position: relative;
    overflow: hidden;
    display: grid;
    gap: 20px;
    padding: clamp(20px, 4svw, 32px);
    animation: rise-in 260ms var(--ease-pop) both;
  }

  .question-card::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(135deg, rgba(255, 79, 121, 0.10), transparent 36%),
      linear-gradient(315deg, rgba(2, 166, 166, 0.10), transparent 32%);
  }

  .question-head,
  .answers,
  .feedback,
  figure,
  .empty {
    position: relative;
    z-index: 1;
  }

  .eyebrow {
    margin: 0;
    color: var(--color-accent);
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: 2.25rem;
  }

  figure {
    overflow: hidden;
    max-height: 320px;
    margin: 0;
    border: 1px solid var(--border-soft);
    border-radius: 12px;
    background: var(--gray-100);
  }

  img {
    width: 100%;
    max-height: 320px;
    object-fit: cover;
  }

  .answers {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .answers button {
    position: relative;
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-height: 68px;
    border: 1px solid var(--border-soft);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.82);
    color: var(--color-ink);
    padding: 12px;
    text-align: left;
    font-weight: 900;
    box-shadow: 0 8px 20px rgba(21, 19, 31, 0.06);
    transition:
      transform var(--duration-fast) var(--ease-pop),
      border-color var(--duration-fast) ease,
      background var(--duration-fast) ease,
      box-shadow var(--duration-fast) ease;
  }

  .answers button:hover:not(:disabled),
  .answers button:focus-visible {
    outline: none;
    transform: translateY(-2px);
    border-color: rgba(255, 79, 121, 0.46);
    box-shadow: 0 14px 28px rgba(21, 19, 31, 0.10);
  }

  .answers button:active:not(:disabled) {
    transform: translateY(0) scale(0.99);
  }

  .answers button.selected {
    border-color: var(--color-accent);
    background: linear-gradient(135deg, rgba(255, 79, 121, 0.14), rgba(255, 209, 102, 0.20));
    box-shadow: 0 12px 28px rgba(255, 79, 121, 0.18);
  }

  .answers button:disabled:not(.selected) {
    opacity: 0.56;
  }

  .key {
    display: grid;
    min-height: 38px;
    place-items: center;
    border-radius: 999px;
    background: var(--color-ink);
    color: white;
    font-size: 13px;
  }

  .selected .key {
    background: var(--color-accent);
  }

  .feedback {
    justify-self: start;
    margin: 0;
    border-radius: 999px;
    background: var(--color-ink);
    color: white;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 900;
  }

  .feedback.correct {
    background: var(--color-success);
  }

  .feedback.wrong {
    background: var(--color-danger);
  }

  @media (max-width: 640px) {
    .question-card {
      padding: 18px;
    }

    h1 {
      font-size: 1.75rem;
    }

    .answers {
      grid-template-columns: 1fr;
    }
  }
</style>
