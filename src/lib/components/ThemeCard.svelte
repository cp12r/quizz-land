<script>
  export let theme;
  export let selected = false;
  export let disabled = false;

  const fallback = {
    name: 'Thème',
    label: 'Preset visuel',
    icon: '/season-1/icons/theme-neon.svg',
    colors: ['#ff4f79', '#39d5ff'],
    motion: 'float',
    badge: 'Live'
  };

  $: meta = { ...fallback, ...(theme || {}) };
  $: style = `--tone-a:${meta.colors?.[0] || fallback.colors[0]}; --tone-b:${meta.colors?.[1] || fallback.colors[1]};`;
</script>

<button
  type="button"
  class:active={selected}
  class:disabled
  class={`theme-card motion-${meta.motion || 'float'}`}
  {disabled}
  {style}
  aria-pressed={selected}
>
  <span class="theme-glow" aria-hidden="true"></span>
  <span class="theme-border" aria-hidden="true"></span>
  <span class="theme-particles" aria-hidden="true">
    <i></i><i></i><i></i><i></i>
  </span>

  <span class="theme-icon" aria-hidden="true">
    <img src={meta.icon} alt="" loading="lazy" />
  </span>

  <span class="theme-label">
    <strong>{meta.name}</strong>
    <em>{meta.label}</em>
  </span>

  <span class="theme-badge">{selected ? 'Actif' : meta.badge}</span>
</button>

<style>
  .theme-card {
    position: relative;
    display: grid;
    min-height: 174px;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 12px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--tone-a) 30%, rgba(230, 232, 239, 0.18));
    border-radius: 8px;
    padding: 14px;
    background:
      radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--tone-a) 42%, transparent), transparent 34%),
      linear-gradient(145deg, rgba(230, 232, 239, 0.1), rgba(230, 232, 239, 0.035)),
      rgba(11, 16, 32, 0.74);
    color: #e6e8ef;
    text-align: left;
    transform-style: preserve-3d;
    transition:
      transform 260ms cubic-bezier(0.16, 1.1, 0.3, 1),
      border-color 220ms ease,
      filter 220ms ease,
      background 220ms ease;
  }

  .theme-card::after {
    content: '';
    position: absolute;
    inset: -40% -80%;
    background: linear-gradient(115deg, transparent 38%, rgba(255, 255, 255, 0.22), transparent 62%);
    opacity: 0;
    transform: translateX(-42%);
    transition:
      opacity 220ms ease,
      transform 620ms ease;
  }

  .theme-glow {
    position: absolute;
    inset: auto -12% -36% -12%;
    height: 72%;
    background: radial-gradient(circle, color-mix(in srgb, var(--tone-b) 42%, transparent), transparent 66%);
    opacity: 0.52;
    pointer-events: none;
  }

  .theme-border {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }

  .theme-icon,
  .theme-label,
  .theme-badge {
    position: relative;
    z-index: 1;
  }

  .theme-icon {
    display: grid;
    width: clamp(58px, 7vw, 76px);
    aspect-ratio: 1;
    place-items: center;
    border-radius: 8px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--tone-a) 28%, #0b1020), #070a16);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  .theme-icon img {
    width: 72%;
    aspect-ratio: 1;
    object-fit: contain;
    filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.34));
    animation: theme-idle 4.8s ease-in-out infinite;
  }

  .theme-label {
    display: grid;
    align-content: end;
    gap: 6px;
    min-width: 0;
  }

  .theme-label strong {
    font-size: clamp(1rem, 1.6vw, 1.24rem);
    line-height: 1;
    text-transform: uppercase;
  }

  .theme-label em {
    color: rgba(230, 232, 239, 0.72);
    font-size: 0.76rem;
    font-style: normal;
    font-weight: 850;
    line-height: 1.25;
  }

  .theme-badge {
    justify-self: start;
    border: 1px solid color-mix(in srgb, var(--tone-b) 46%, rgba(230, 232, 239, 0.14));
    border-radius: 999px;
    padding: 6px 9px;
    background: rgba(230, 232, 239, 0.08);
    color: color-mix(in srgb, var(--tone-b) 72%, white);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.66rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .theme-particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .theme-particles i {
    position: absolute;
    width: 5px;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--tone-b);
    opacity: 0.62;
    animation: theme-particle 5.4s ease-in-out infinite;
  }

  .theme-particles i:nth-child(1) { top: 18%; right: 18%; }
  .theme-particles i:nth-child(2) { top: 42%; right: 10%; animation-delay: -1.2s; background: var(--tone-a); }
  .theme-particles i:nth-child(3) { bottom: 18%; left: 12%; animation-delay: -2.2s; }
  .theme-particles i:nth-child(4) { bottom: 34%; right: 32%; animation-delay: -3.1s; background: #ffd54a; }

  .theme-card:hover {
    border-color: color-mix(in srgb, var(--tone-b) 70%, white);
    filter: saturate(1.12);
    transform: translateY(-7px) rotateX(3deg) rotateY(-4deg);
  }

  .theme-card:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--tone-b) 72%, white);
    outline-offset: 4px;
  }

  .theme-card:hover::after {
    opacity: 1;
    transform: translateX(44%);
  }

  .theme-card.active {
    border-color: color-mix(in srgb, var(--tone-b) 82%, white);
    background:
      radial-gradient(circle at 22% 12%, color-mix(in srgb, var(--tone-a) 58%, transparent), transparent 36%),
      linear-gradient(145deg, color-mix(in srgb, var(--tone-a) 22%, rgba(230, 232, 239, 0.08)), rgba(230, 232, 239, 0.05)),
      rgba(11, 16, 32, 0.82);
  }

  .theme-card.active .theme-border {
    background:
      linear-gradient(90deg, var(--tone-a), var(--tone-b), var(--tone-a)) border-box;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    padding: 2px;
    animation: theme-selected 2.6s linear infinite;
  }

  .theme-card.disabled {
    cursor: not-allowed;
    filter: grayscale(1);
    opacity: 0.48;
  }

  .theme-card.disabled,
  .theme-card.disabled .theme-icon img,
  .theme-card.disabled .theme-particles i {
    animation: none;
  }

  .motion-bounce .theme-icon img { animation-name: theme-bounce; }
  .motion-glitch .theme-icon img { animation-name: theme-glitch; }
  .motion-pulse .theme-icon img { animation-name: theme-pulse; }

  @keyframes theme-idle {
    50% { transform: translate3d(0, -5px, 0); }
  }

  @keyframes theme-bounce {
    50% { transform: translate3d(0, -7px, 0) scale(1.035); }
    64% { transform: translate3d(0, 1px, 0) scale(0.99); }
  }

  @keyframes theme-glitch {
    0%, 86%, 100% { transform: translate3d(0, 0, 0); }
    88% { transform: translate3d(3px, -1px, 0); }
    90% { transform: translate3d(-2px, 1px, 0); }
  }

  @keyframes theme-pulse {
    50% { transform: scale(1.045); opacity: 0.9; }
  }

  @keyframes theme-particle {
    50% { transform: translate3d(0, -12px, 0); opacity: 0.28; }
  }

  @keyframes theme-selected {
    to { filter: hue-rotate(38deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-card,
    .theme-card::after,
    .theme-card *,
    .theme-card.active .theme-border {
      transition: none !important;
      animation: none !important;
    }
  }
</style>
