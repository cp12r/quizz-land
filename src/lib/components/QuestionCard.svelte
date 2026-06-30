<script>
  import { onDestroy } from 'svelte';
  import { getSeasonAssetLabel, getSeasonFrame, getSeasonIcon } from '$lib/utils/seasonAssets.js';
  import { questionMedia } from '$lib/utils/questionMedia.js';

  export let question = null;
  export let selected = null;
  export let locked = false;
  export let feedback = null;
  export let onAnswer = () => {};

  let audioEl;
  let imageFailed = false;
  let fallbackFailed = false;
  let imageLoaded = false;
  let audioFailed = false;
  let audioPlaying = false;
  let audioLoading = false;
  let audioStopTimer = null;
  let audioVolume = 0.85;
  let lastQuestionId = null;

  $: media = questionMedia(question);
  $: displayImage = imageFailed && media.imageFallback ? media.imageFallback : media.image;
  $: hasImage = Boolean(displayImage && !(imageFailed && (!media.imageFallback || fallbackFailed)));
  $: hasAudio = Boolean(media.audio && !audioFailed);
  $: categoryIcon = question ? getSeasonIcon(question.category) : '';
  $: categoryFrame = question ? getSeasonFrame(question.category) : '';
  $: categoryLabel = question ? getSeasonAssetLabel(question.category) : 'Quiz';
  $: revealedCorrectIndex = feedback?.correctIndex ?? question?.correctIndex;

  $: if (question?.id && question.id !== lastQuestionId) {
    lastQuestionId = question.id;
    imageFailed = false;
    fallbackFailed = false;
    imageLoaded = false;
    audioFailed = false;
    audioPlaying = false;
    audioLoading = false;
    if (audioEl) {
      stopAudio();
      audioEl.currentTime = 0;
      audioEl.load();
    }
  }

  function toggleAudio() {
    if (!audioEl || audioFailed) return;
    if (audioEl.paused) {
      playAudioExcerpt();
    } else {
      stopAudio();
    }
  }

  function stopAudio() {
    if (audioStopTimer) {
      clearTimeout(audioStopTimer);
      audioStopTimer = null;
    }
    audioEl?.pause();
    audioLoading = false;
    audioPlaying = false;
  }

  function playAudioExcerpt() {
    stopAudio();
    audioLoading = true;
    audioEl.volume = Math.max(0, Math.min(1, audioVolume));
    const start = Number.isFinite(media.audioStart) ? media.audioStart : 0;
    const duration = Number.isFinite(media.audioDuration) ? media.audioDuration : 8;

    function begin() {
      try {
        audioEl.currentTime = Math.max(0, start);
      } catch {
        // Some streams only allow seeking after enough metadata is available.
      }

      audioEl.play().then(() => {
        audioLoading = false;
        audioStopTimer = setTimeout(stopAudio, Math.max(3, Math.min(15, duration)) * 1000);
      }).catch(() => {
        audioLoading = false;
        audioFailed = true;
      });
    }

    if (audioEl.readyState >= 1) begin();
    else {
      audioEl.load();
      audioEl.addEventListener('loadedmetadata', begin, { once: true });
      audioEl.addEventListener('error', () => {
        audioLoading = false;
        audioFailed = true;
      }, { once: true });
    }
  }

  function setAudioVolume(value) {
    audioVolume = Math.max(0, Math.min(1, Number(value) || 0));
    if (audioEl) audioEl.volume = audioVolume;
  }

  onDestroy(() => {
    stopAudio();
    if (!audioEl) return;
    audioEl.src = '';
  });
</script>

<section class="card question-card">
  {#if question}
    <img class="season-frame ql-frame-glow" src={categoryFrame} alt="" aria-hidden="true" loading="lazy" />
    <div class="question-head">
      <p class="mono eyebrow">
        <img class="category-icon ql-bob" src={categoryIcon} alt="" aria-hidden="true" loading="lazy" />
        <span>{categoryLabel}</span>
      </p>
      {#if question.text}
        <h2>{question.text}</h2>
      {/if}
    </div>

    {#if media.image}
      <figure class:image-ready={imageLoaded} class:image-missing={!hasImage}>
        {#if hasImage}
          <div class="media-placeholder" aria-hidden={imageLoaded ? 'true' : 'false'}>Chargement image</div>
          <img
            src={displayImage}
            alt={media.imageAlt}
            loading="eager"
            decoding="async"
            on:load={() => (imageLoaded = true)}
            on:error={() => {
              if (!imageFailed && media.imageFallback) {
                imageFailed = true;
                imageLoaded = false;
              } else {
                fallbackFailed = true;
                imageFailed = true;
              }
            }}
          />
        {:else}
          <figcaption>Média indisponible, la question continue.</figcaption>
        {/if}
      </figure>
    {/if}

    {#if hasAudio}
      <div class="audio-panel">
        <button class="audio-toggle" type="button" on:click={toggleAudio} aria-label={audioPlaying ? 'Mettre l’extrait en pause' : 'Lire l’extrait audio'}>
          <span class:playing={audioPlaying} aria-hidden="true"></span>
        </button>
        <div class="audio-copy">
          <strong>{media.audioLabel}</strong>
          <span>{audioLoading ? 'Chargement' : audioPlaying ? 'Lecture en cours' : 'Prêt à écouter'}</span>
        </div>
        <label class="volume-control">
          <span class="mono">Vol</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audioVolume}
            on:input={(event) => setAudioVolume(event.currentTarget.value)}
            aria-label="Volume de l’extrait audio"
          />
          <output class="mono">{Math.round(audioVolume * 100)}</output>
        </label>
        <div class="audio-meter" class:active={audioPlaying} aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <audio
          bind:this={audioEl}
          src={media.audio}
          preload="metadata"
          on:play={() => (audioPlaying = true)}
          on:pause={() => (audioPlaying = false)}
          on:ended={() => (audioPlaying = false)}
          on:error={() => {
            audioLoading = false;
            audioFailed = true;
          }}
        ></audio>
      </div>
    {:else if media.audio && audioFailed}
      <p class="media-fallback mono">Audio indisponible, la question continue.</p>
    {/if}

    <div class="answers" class:locked>
      {#each question.answers as answer, index}
        <button
          type="button"
          class:selected={selected === index}
          class:correctAnswer={locked && revealedCorrectIndex === index}
          class:wrongAnswer={feedback && selected === index && !feedback.correct}
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
      <p class="mono eyebrow">Prochaine manche</p>
      <h2>Le reveal arrive</h2>
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
      radial-gradient(circle at 14% 0%, rgba(229, 57, 53, 0.22), transparent 34%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.025)),
      rgba(23, 30, 49, 0.86);
    color: var(--gray-900);
    box-shadow:
      0 26px 70px rgba(0, 0, 0, 0.28),
      inset 0 0 0 1px rgba(255, 255, 255, 0.07);
    transform: rotateX(0.001deg);
    animation: rise-in 260ms var(--ease-pop) both;
  }

  .question-card::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(135deg, rgba(255, 90, 95, 0.16), transparent 36%),
      linear-gradient(315deg, rgba(255, 213, 74, 0.1), transparent 32%),
      repeating-linear-gradient(90deg, rgba(230, 232, 239, 0.026) 0 1px, transparent 1px 72px);
  }

  .season-frame {
    position: absolute;
    inset: 4px;
    z-index: 0;
    width: calc(100% - 8px);
    height: calc(100% - 8px);
    object-fit: fill;
    opacity: 0.32;
    pointer-events: none;
  }

  .question-head,
  .answers,
  .feedback,
  figure,
  .audio-panel,
  .media-fallback,
  .empty {
    position: relative;
    z-index: 1;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    justify-self: start;
    margin: 0;
    border: 1px solid rgba(255, 213, 74, 0.2);
    border-radius: 999px;
    background: rgba(11, 16, 32, 0.5);
    color: var(--color-yellow);
    padding: 5px 10px 5px 6px;
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .category-icon {
    width: 34px;
    aspect-ratio: 1;
    object-fit: contain;
  }

  h2 {
    margin: 0;
    color: var(--gray-900);
    font-size: clamp(1.85rem, 4svw, 3.25rem);
    line-height: 0.98;
    text-transform: uppercase;
  }

  figure {
    position: relative;
    display: grid;
    min-height: clamp(180px, 30svw, 320px);
    overflow: hidden;
    max-height: 320px;
    margin: 0;
    border: 1px solid var(--border-soft);
    border-radius: 8px;
    background: rgba(11, 16, 32, 0.46);
  }

  img {
    width: 100%;
    max-height: 320px;
    object-fit: cover;
  }

  figure > img {
    height: 100%;
    min-height: inherit;
    opacity: 0;
    transition: opacity 180ms ease;
  }

  figure.image-ready > img {
    opacity: 1;
  }

  figure.image-missing {
    min-height: 96px;
    place-items: center;
    padding: 18px;
  }

  figure figcaption,
  .media-placeholder,
  .media-fallback {
    color: rgba(230, 232, 239, 0.72);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.74rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .media-placeholder {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background:
      linear-gradient(90deg, rgba(230, 232, 239, 0.04), rgba(230, 232, 239, 0.12), rgba(230, 232, 239, 0.04)),
      rgba(11, 16, 32, 0.62);
    background-size: 220% 100%;
    animation: media-loading 1.1s linear infinite;
  }

  .image-ready .media-placeholder {
    display: none;
  }

  .audio-panel {
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr) minmax(140px, 210px) 42px;
    gap: 12px;
    align-items: center;
    border: 1px solid rgba(255, 213, 74, 0.22);
    border-radius: 8px;
    padding: 12px;
    background:
      linear-gradient(90deg, rgba(255, 213, 74, 0.12), rgba(57, 213, 255, 0.08)),
      rgba(11, 16, 32, 0.58);
  }

  .audio-toggle {
    position: relative;
    display: grid;
    width: 58px;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgba(230, 232, 239, 0.2);
    border-radius: 50%;
    background: var(--color-yellow);
    color: var(--color-ink);
    font-weight: 950;
    transition:
      transform 160ms ease,
      filter 160ms ease;
  }

  .audio-toggle:hover,
  .audio-toggle:focus-visible {
    outline: none;
    transform: scale(1.04);
    filter: brightness(1.06);
  }

  .audio-toggle span {
    display: block;
    width: 0;
    height: 0;
    margin-left: 4px;
    border-top: 11px solid transparent;
    border-bottom: 11px solid transparent;
    border-left: 17px solid var(--color-ink);
  }

  .audio-toggle span.playing {
    width: 18px;
    height: 22px;
    margin-left: 0;
    border: 0;
    background:
      linear-gradient(90deg, var(--color-ink) 0 6px, transparent 6px 12px, var(--color-ink) 12px 18px);
  }

  .audio-copy {
    display: grid;
    min-width: 0;
    gap: 3px;
  }

  .audio-copy strong,
  .audio-copy span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .audio-copy strong {
    color: var(--gray-900);
    font-weight: 950;
  }

  .audio-copy span {
    color: rgba(230, 232, 239, 0.72);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .volume-control {
    display: grid;
    grid-template-columns: auto minmax(78px, 1fr) 32px;
    gap: 8px;
    align-items: center;
    min-width: 0;
    border: 1px solid rgba(230, 232, 239, 0.14);
    border-radius: 8px;
    padding: 8px;
    background: rgba(11, 16, 32, 0.36);
  }

  .volume-control span,
  .volume-control output {
    color: rgba(230, 232, 239, 0.76);
    font-size: 0.68rem;
    font-weight: 900;
  }

  .volume-control input {
    min-width: 0;
    width: 100%;
    accent-color: var(--color-yellow);
  }

  .audio-meter {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 3px;
    align-items: end;
    height: 32px;
  }

  .audio-meter span {
    display: block;
    height: 9px;
    border-radius: 999px;
    background: rgba(255, 213, 74, 0.32);
  }

  .audio-meter.active span {
    animation: audio-bar 620ms ease-in-out infinite alternate;
    background: var(--color-yellow);
  }

  .audio-meter span:nth-child(2) {
    animation-delay: 110ms;
  }

  .audio-meter span:nth-child(3) {
    animation-delay: 220ms;
  }

  .audio-meter span:nth-child(4) {
    animation-delay: 330ms;
  }

  audio {
    display: none;
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
    border: 1px solid rgba(230, 232, 239, 0.13);
    border-radius: 8px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.055), transparent),
      rgba(33, 42, 69, 0.88);
    color: var(--gray-900);
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
    border-color: rgba(255, 213, 74, 0.5);
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.2), 0 0 24px rgba(255, 213, 74, 0.08);
    filter: saturate(1.06);
  }

  .answers button:active:not(:disabled) {
    transform: translateY(0) scale(0.99);
  }

  .answers button.selected {
    border-color: var(--color-accent);
    background:
      linear-gradient(135deg, rgba(198, 40, 40, 0.82), rgba(229, 57, 53, 0.42)),
      rgba(33, 42, 69, 0.92);
    color: white;
    box-shadow:
      0 14px 32px rgba(229, 57, 53, 0.24),
      inset 0 0 0 1px rgba(255, 255, 255, 0.09);
  }

  .answers button.correctAnswer {
    border-color: rgba(54, 210, 124, 0.68);
    background:
      linear-gradient(135deg, rgba(54, 210, 124, 0.78), rgba(57, 213, 255, 0.24)),
      rgba(33, 42, 69, 0.92);
    color: #07140f;
    animation: answer-reveal 420ms cubic-bezier(0.16, 1.1, 0.3, 1) both;
  }

  .answers button.wrongAnswer {
    border-color: rgba(229, 57, 53, 0.74);
    animation: answer-shake 260ms ease both;
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
    color: var(--color-yellow);
    font-size: 13px;
  }

  .selected .key {
    background: var(--color-accent-strong);
    color: white;
  }

  .feedback {
    justify-self: start;
    margin: 0;
    border: 1px solid rgba(230, 232, 239, 0.16);
    border-radius: 8px;
    background: rgba(11, 16, 32, 0.9);
    color: var(--gray-900);
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 900;
  }

  .feedback.correct {
    background: var(--color-success);
    color: #07140f;
  }

  .feedback.wrong {
    background: var(--color-danger);
    color: white;
  }

  @media (max-width: 640px) {
    .question-card {
      padding: 18px;
    }

    h2 {
      font-size: 1.75rem;
    }

    .answers {
      grid-template-columns: 1fr;
    }

    .audio-panel {
      grid-template-columns: 50px minmax(0, 1fr);
      gap: 10px;
    }

    .audio-toggle {
      width: 50px;
    }

    .volume-control,
    .audio-meter {
      grid-column: 1 / -1;
    }
  }

  @keyframes answer-reveal {
    0% {
      transform: scale(0.98);
      filter: brightness(1);
    }
    55% {
      transform: scale(1.025);
      filter: brightness(1.18);
    }
    100% {
      transform: scale(1);
      filter: brightness(1);
    }
  }

  @keyframes answer-shake {
    25% {
      transform: translateX(-4px);
    }
    50% {
      transform: translateX(4px);
    }
    75% {
      transform: translateX(-2px);
    }
  }

  @keyframes media-loading {
    from {
      background-position: 220% 0;
    }
    to {
      background-position: -220% 0;
    }
  }

  @keyframes audio-bar {
    from {
      height: 8px;
      opacity: 0.55;
    }
    to {
      height: 30px;
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .question-card,
    .answers button.correctAnswer,
    .answers button.wrongAnswer,
    .audio-meter.active span {
      animation: none;
    }
  }
</style>
