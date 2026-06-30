<script>
  export let themes = [];
  export let selected = '';
  export let onSelect = () => {};

  const fallbackColors = ['#ff4f79', '#39d5ff'];
  const difficulties = ['Facile', 'Normal', 'Expert', 'Mix'];

  function getQuestionCount(theme, index) {
    return Number(theme.questionCount || theme.questions || 18 + index * 6);
  }

  function getDifficulty(theme, index) {
    return theme.difficulty || difficulties[index % difficulties.length];
  }

  function getBadges(theme, index) {
    const badges = [];
    if (index === 0 || theme.badge === 'Live') badges.push('Nouveau');
    if (index === 1 || theme.badge === 'Fun' || theme.motion === 'glitch') badges.push('Viral');
    return badges;
  }
</script>

<section class="theme-picker" aria-label="Sélection du thème">
  {#if themes.length}
    <div class="theme-grid">
      {#each themes as theme, index (theme.id)}
        {@const colors = theme.colors?.length ? theme.colors : fallbackColors}
        <article class:selected={selected === theme.id} class="theme-option" style={`--tone-a:${colors[0]}; --tone-b:${colors[1] || colors[0]};`}>
          <div class="theme-top">
            <img src={theme.icon} alt="" aria-hidden="true" loading="lazy" />
            <span class="preview" aria-hidden="true"></span>
          </div>
          <div class="theme-copy">
            <h3>{theme.name}</h3>
            <p>{getQuestionCount(theme, index)} questions</p>
          </div>
          <div class="theme-meta">
            <span>{getDifficulty(theme, index)}</span>
            {#each getBadges(theme, index) as badge}
              <strong>{badge}</strong>
            {/each}
          </div>
          <button type="button" on:click={() => onSelect(theme.id)} aria-pressed={selected === theme.id}>
            {selected === theme.id ? 'Sélectionné' : 'Sélectionner'}
          </button>
        </article>
      {/each}
    </div>
  {:else}
    <div class="empty-themes">
      <strong>Aucun thème disponible</strong>
      <span>Relance la page ou crée un salon avec les réglages par défaut.</span>
    </div>
  {/if}
</section>

<style>
  .theme-picker {
    min-width: 0;
  }

  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(190px, 100%), 1fr));
    gap: 12px;
  }

  .theme-option {
    position: relative;
    display: grid;
    min-width: 0;
    min-height: 246px;
    gap: 12px;
    overflow: hidden;
    border: 1px solid rgba(230, 232, 239, 0.16);
    border-radius: 8px;
    padding: 14px;
    background:
      radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--tone-a) 32%, transparent), transparent 46%),
      linear-gradient(145deg, rgba(230, 232, 239, 0.095), rgba(230, 232, 239, 0.035)),
      rgba(11, 16, 32, 0.72);
    color: #e6e8ef;
    transform-style: preserve-3d;
    transition:
      transform 180ms cubic-bezier(0.16, 1.1, 0.3, 1),
      border-color 180ms ease,
      box-shadow 180ms ease;
  }

  .theme-option::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(120deg, transparent 10%, rgba(255, 255, 255, 0.13), transparent 42%);
    opacity: 0;
    transform: translateX(-40%);
    transition: opacity 180ms ease, transform 280ms ease;
  }

  .theme-option:hover,
  .theme-option:focus-within {
    border-color: color-mix(in srgb, var(--tone-b) 58%, white);
    transform: translateY(-5px) rotateX(3deg) rotateY(-2deg);
    box-shadow: 0 22px 42px rgba(0, 0, 0, 0.24), 0 0 30px color-mix(in srgb, var(--tone-b) 18%, transparent);
  }

  .theme-option:hover::after {
    opacity: 1;
    transform: translateX(40%);
  }

  .theme-option.selected {
    border-color: color-mix(in srgb, var(--tone-b) 72%, white);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--tone-b) 34%, transparent), 0 22px 48px rgba(0, 0, 0, 0.26);
  }

  .theme-top,
  .theme-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .theme-copy {
    min-width: 0;
  }

  img {
    width: 50px;
    aspect-ratio: 1;
    object-fit: contain;
    filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.25));
  }

  .preview {
    width: 54px;
    height: 28px;
    border: 1px solid rgba(230, 232, 239, 0.24);
    border-radius: 999px;
    background: linear-gradient(135deg, var(--tone-a), var(--tone-b));
  }

  h3,
  p {
    margin: 0;
  }

  h3 {
    font-size: clamp(1rem, 1.7vw, 1.16rem);
    line-height: 1;
    text-transform: uppercase;
    word-break: normal;
    overflow-wrap: anywhere;
  }

  p {
    margin-top: 5px;
    color: rgba(230, 232, 239, 0.7);
    font-size: 0.82rem;
    font-weight: 850;
  }

  .theme-meta {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .theme-meta span,
  .theme-meta strong {
    border: 1px solid rgba(230, 232, 239, 0.16);
    border-radius: 999px;
    padding: 6px 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.66rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .theme-meta strong {
    border-color: color-mix(in srgb, var(--tone-b) 48%, white);
    color: var(--tone-b);
  }

  button {
    min-height: 42px;
    width: 100%;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 8px;
    background: #e6e8ef;
    color: #0b1020;
    padding: 0 8px;
    font-size: clamp(0.78rem, 1.5vw, 0.9rem);
    font-weight: 950;
    line-height: 1.05;
    text-transform: uppercase;
    white-space: normal;
  }

  .selected button {
    background: linear-gradient(135deg, var(--tone-a), var(--tone-b));
  }

  .empty-themes {
    display: grid;
    gap: 6px;
    border: 1px solid rgba(255, 213, 74, 0.24);
    border-radius: 8px;
    padding: 16px;
    background: rgba(255, 213, 74, 0.08);
    color: #e6e8ef;
  }

  @media (max-width: 980px) {
    .theme-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 620px) {
    .theme-grid {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scroll-snap-type: x mandatory;
      padding-bottom: 6px;
    }

    .theme-option {
      flex: 0 0 min(82vw, 310px);
      scroll-snap-align: start;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-option,
    .theme-option::after {
      transition: none;
      transform: none !important;
    }
  }
</style>
