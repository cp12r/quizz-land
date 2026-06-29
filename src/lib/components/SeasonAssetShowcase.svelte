<script>
  export let compact = false;
  export let limitIcons = 22;
  export let limitFrames = 10;

  const icons = [
    ['gaming', 'Gaming', 'ql-float'],
    ['cinema', 'Cinéma', 'ql-bounce'],
    ['series', 'Séries', 'ql-tilt'],
    ['musique', 'Musique', 'ql-pulse'],
    ['rap-fr', 'Rap FR', 'ql-rotate'],
    ['anime', 'Anime', 'ql-bob'],
    ['memes', 'Memes', 'ql-shake'],
    ['discord', 'Discord', 'ql-glow'],
    ['geographie', 'Géographie', 'ql-spin'],
    ['sciences', 'Sciences', 'ql-bubble'],
    ['football', 'Football', 'ql-kick'],
    ['histoire', 'Histoire', 'ql-pop'],
    ['sport', 'Sport', 'ql-pop'],
    ['culture-gen', 'Culture Gén.', 'ql-think'],
    ['pieges', 'Pièges', 'ql-wiggle'],
    ['rap-us', 'Rap US', 'ql-float'],
    ['logo-quiz', 'Logo Quiz', 'ql-glow'],
    ['blindtest', 'Blindtest', 'ql-pulse'],
    ['duel', 'Duel', 'ql-tilt'],
    ['chaos', 'Chaos', 'ql-spin'],
    ['crown', 'Crown', 'ql-bob'],
    ['timer', 'Timer', 'ql-kick']
  ];

  const frames = [
    ['fire', 'Fire', 'ql-frame-glow'],
    ['neon-glitch', 'Neon Glitch', 'ql-neon-flicker'],
    ['royal', 'Royal', 'ql-frame-glow'],
    ['electric', 'Electric', 'ql-frame-dash'],
    ['slime', 'Slime', 'ql-bubble'],
    ['space', 'Space', 'ql-float'],
    ['love', 'Love', 'ql-pulse'],
    ['golden', 'Golden', 'ql-frame-glow'],
    ['ice', 'Ice', 'ql-bob'],
    ['halloween', 'Halloween', 'ql-wiggle']
  ];

  const animations = [
    ['ql-float', 'Float', 'gaming'],
    ['ql-bounce', 'Bounce', 'cinema'],
    ['ql-tilt', 'Tilt', 'series'],
    ['ql-pulse', 'Pulse', 'musique'],
    ['ql-rotate', 'Rotate', 'rap-fr'],
    ['ql-bob', 'Bob', 'anime'],
    ['ql-shake', 'Shake', 'memes'],
    ['ql-glow', 'Glow', 'discord'],
    ['ql-spin', 'Spin', 'geographie'],
    ['ql-bubble', 'Bubble', 'sciences'],
    ['ql-kick', 'Kick', 'football'],
    ['ql-pop', 'Pop', 'sport'],
    ['ql-think', 'Think', 'culture-gen'],
    ['ql-wiggle', 'Wiggle', 'pieges']
  ];

  $: shownIcons = icons.slice(0, limitIcons);
  $: shownFrames = frames.slice(0, limitFrames);
  $: shownAnimations = compact ? animations.slice(0, 8) : animations;
</script>

<section class:compact class="season-showcase" aria-labelledby="season-title">
  <div class="season-hero">
    <div>
      <p class="season-kicker">Season 1</p>
      <h2 id="season-title">Icônes 3D animées + Frames SVG</h2>
    </div>
    <a class="season-cta" href="#season-1-assets">Découvrir la saison 1</a>
  </div>

  <div class="asset-panel" id="season-1-assets">
    <div class="panel-title">
      <span>Icônes 3D</span>
      <strong>{shownIcons.length}</strong>
    </div>
    <div class="asset-grid icon-grid">
      {#each shownIcons as [id, label, animation], index}
        <article class="asset-tile" style={`--asset-delay:${Math.min(index, 10) * 32}ms;`}>
          <img
            class={animation}
            src={`/season-1/icons/${id}.svg`}
            alt={`Icône Season 1 ${label}`}
            loading="lazy"
            decoding="async"
          />
          <span>{index + 1}. {label}</span>
        </article>
      {/each}
    </div>
  </div>

  <div class="asset-panel">
    <div class="panel-title">
      <span>Frames SVG</span>
      <strong>{shownFrames.length}</strong>
    </div>
    <div class="asset-grid frame-grid">
      {#each shownFrames as [id, label, animation], index}
        <article class="asset-tile frame-tile" style={`--asset-delay:${Math.min(index, 10) * 36}ms;`}>
          <img
            class={animation}
            src={`/season-1/frames/${id}.svg`}
            alt={`Frame Season 1 ${label}`}
            loading="lazy"
            decoding="async"
          />
          <span>{index + 1}. {label}</span>
        </article>
      {/each}
    </div>
  </div>

  <div class="asset-panel animation-panel">
    <div class="panel-title">
      <span>Aperçu animations</span>
      <strong>{shownAnimations.length}</strong>
    </div>
    <div class="animation-strip" aria-label="Animations Season 1 disponibles">
      {#each shownAnimations as [animation, label, icon]}
        <article>
          <img
            class={animation}
            src={`/season-1/icons/${icon}.svg`}
            alt={`Animation ${label}`}
            loading="lazy"
            decoding="async"
          />
          <span>{label}</span>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .season-showcase {
    --season-bg: rgba(6, 8, 22, 0.76);
    --season-panel: rgba(230, 232, 239, 0.06);
    --season-line: rgba(168, 85, 247, 0.32);
    --season-text: #f8fafc;
    --season-muted: rgba(230, 232, 239, 0.72);
    --season-cyan: #39d5ff;
    --season-pink: #ff4f79;
    --season-purple: #a855f7;
    display: grid;
    width: min(1280px, 100%);
    gap: clamp(14px, 2vw, 18px);
    margin: 0 auto;
    overflow: hidden;
    border: 1px solid var(--season-line);
    border-radius: 8px;
    padding: clamp(14px, 2.4vw, 24px);
    background:
      radial-gradient(circle at 16% 0%, rgba(168, 85, 247, 0.22), transparent 30%),
      radial-gradient(circle at 86% 16%, rgba(57, 213, 255, 0.16), transparent 28%),
      linear-gradient(135deg, rgba(230, 232, 239, 0.08), rgba(230, 232, 239, 0.02)),
      var(--season-bg);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.34);
  }

  .season-hero,
  .panel-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .season-kicker,
  .season-hero h2,
  .panel-title span,
  .panel-title strong {
    margin: 0;
    text-transform: uppercase;
  }

  .season-kicker,
  .panel-title span {
    color: var(--season-cyan);
    font-family: 'JetBrains Mono', monospace;
    font-size: clamp(0.72rem, 1.4vw, 0.88rem);
    font-weight: 900;
  }

  .season-hero h2 {
    color: var(--season-text);
    font-size: clamp(1.6rem, 5vw, 3.8rem);
    line-height: 0.95;
  }

  .season-cta {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 79, 121, 0.4);
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(255, 79, 121, 0.28), rgba(168, 85, 247, 0.22));
    color: var(--season-text);
    padding: 0 14px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .asset-panel {
    display: grid;
    gap: 12px;
    border: 1px solid rgba(230, 232, 239, 0.12);
    border-radius: 8px;
    padding: clamp(10px, 1.6vw, 14px);
    background: var(--season-panel);
  }

  .panel-title strong {
    display: grid;
    min-width: 36px;
    min-height: 30px;
    place-items: center;
    border-radius: 999px;
    background: rgba(57, 213, 255, 0.12);
    color: var(--season-text);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.76rem;
  }

  .asset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(clamp(92px, 10vw, 138px), 1fr));
    gap: clamp(8px, 1.4vw, 14px);
  }

  .frame-grid {
    grid-template-columns: repeat(auto-fit, minmax(clamp(138px, 18vw, 220px), 1fr));
  }

  .asset-tile {
    display: grid;
    min-width: 0;
    gap: 8px;
    align-content: start;
    border: 1px solid rgba(230, 232, 239, 0.11);
    border-radius: 8px;
    padding: clamp(8px, 1.2vw, 12px);
    background: rgba(11, 16, 32, 0.56);
    animation: season-rise 420ms cubic-bezier(0.16, 1.1, 0.3, 1) both;
    animation-delay: var(--asset-delay, 0ms);
  }

  .asset-tile img {
    width: min(100%, 142px);
    aspect-ratio: 1;
    justify-self: center;
    object-fit: contain;
  }

  .frame-tile img {
    width: min(100%, 220px);
    aspect-ratio: 16 / 11;
  }

  .asset-tile span,
  .animation-strip span {
    overflow: hidden;
    color: var(--season-muted);
    font-size: clamp(0.68rem, 1.2vw, 0.78rem);
    font-weight: 900;
    text-align: center;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .animation-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(clamp(84px, 9vw, 118px), 1fr));
    gap: 10px;
  }

  .animation-strip article {
    display: grid;
    gap: 6px;
    justify-items: center;
    min-width: 0;
  }

  .animation-strip img {
    width: clamp(54px, 8vw, 82px);
    aspect-ratio: 1;
  }

  .compact {
    gap: 12px;
  }

  .compact .asset-grid {
    grid-template-columns: repeat(auto-fit, minmax(clamp(86px, 12vw, 118px), 1fr));
  }

  .compact .frame-grid {
    grid-template-columns: repeat(auto-fit, minmax(clamp(132px, 22vw, 180px), 1fr));
  }

  .compact .asset-tile img {
    width: min(100%, 112px);
  }

  .compact .frame-tile img {
    width: min(100%, 180px);
  }

  @keyframes season-rise {
    from {
      opacity: 0;
      transform: translateY(14px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 760px) {
    .season-hero {
      display: grid;
    }

    .season-cta {
      width: 100%;
    }

    .asset-grid,
    .compact .asset-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .frame-grid,
    .compact .frame-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .asset-tile {
      padding: 8px;
    }

    .asset-tile img,
    .compact .asset-tile img {
      width: min(100%, 96px);
    }

    .frame-tile img,
    .compact .frame-tile img {
      width: min(100%, 150px);
    }

    .animation-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .asset-tile {
      animation: none;
    }
  }
</style>
