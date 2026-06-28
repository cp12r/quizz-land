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
    border-radius: 8px;
    padding: clamp(20px, 4svw, 32px);
    background:
      linear-gradient(135deg, rgba(255, 250, 240, 0.1), rgba(255, 250, 240, 0.035)),
      rgba(23, 21, 27, 0.72);
    color: #fffaf0;
    box-shadow:
      0 26px 70px rgba(0, 0, 0, 0.28),
      inset 0 0 0 1px rgba(255, 250, 240, 0.08);
    transform: rotateX(0.001deg);
    animation: rise-in 260ms var(--ease-pop) both;
  }

  .question-card::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(135deg, rgba(255, 79, 121, 0.14), transparent 36%),
      linear-gradient(315deg, rgba(2, 166, 166, 0.12), transparent 32%),
      repeating-linear-gradient(90deg, rgba(255, 250, 240, 0.026) 0 1px, transparent 1px 72px);
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
    color: var(--color-yellow);
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: #fffaf0;
    font-size: clamp(1.85rem, 4svw, 3.25rem);
    line-height: 0.98;
    text-transform: uppercase;
  }

  figure {
    overflow: hidden;
    max-height: 320px;
    margin: 0;
    border: 1px solid var(--border-soft);
    border-radius: 8px;
    background: rgba(255, 250, 240, 0.08);
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
    min-height: 74px;
    border: 1px solid rgba(255, 250, 240, 0.14);
    border-radius: 8px;
    background:
      linear-gradient(160deg, rgba(255, 255, 255, 0.9), rgba(255, 250, 240, 0.78)),
      #fffaf0;
    color: var(--color-ink);
    padding: 12px;
    text-align: left;
    font-weight: 900;
    box-shadow: 0 8px 20px rgba(21, 19, 31, 0.06);
    transition:
      transform var(--duration-fast) var(--ease-pop),
      border-color var(--duration-fast) ease,
      background var(--duration-fast) ease,
      box-shadow var(--duration-fast) ease,
      filter var(--duration-fast) ease;
  }

  .answers button:hover:not(:disabled),
  .answers button:focus-visible {
    outline: none;
    transform: translateY(-2px);
    border-color: rgba(248, 243, 74, 0.5);
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.16);
    filter: saturate(1.06);
  }

  .answers button:active:not(:disabled) {
    transform: translateY(0) scale(0.99);
  }

  .answers button.selected {
    border-color: var(--color-accent);
    background:
      linear-gradient(135deg, rgba(255, 209, 102, 0.52), rgba(255, 79, 121, 0.22)),
      #fffaf0;
    box-shadow:
      0 14px 32px rgba(255, 79, 121, 0.18),
      inset 0 0 0 1px rgba(23, 21, 27, 0.08);
  }

  .answers button:disabled:not(.selected) {
    opacity: 0.56;
  }

  .key {
    display: grid;
    min-height: 38px;
    place-items: center;
    border-radius: 8px;
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
    border: 1px solid rgba(255, 250, 240, 0.18);
    border-radius: 8px;
    background: rgba(23, 21, 27, 0.88);
    color: #fffaf0;
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
