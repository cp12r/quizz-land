<script>
  export let remaining = 0;
  export let total = 30;

  $: progress = total ? Math.max(0, Math.min(1, remaining / total)) : 0;
  $: dash = `${Math.round(progress * 100)} 100`;
  $: urgent = progress <= 0.25;
</script>

<div class:urgent class="timer" aria-label={`${remaining} secondes restantes`}>
  <svg viewBox="0 0 36 36">
    <path class="track" d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 0 1 0-31" />
    <path class="value" stroke-dasharray={dash} d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 0 1 0-31" />
  </svg>
  <strong class="mono">{remaining}</strong>
</div>

<style>
  .timer {
    position: relative;
    display: grid;
    width: 82px;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 50%, rgba(229, 57, 53, 0.12), transparent 56%),
      rgba(11, 16, 32, 0.82);
    box-shadow:
      0 16px 40px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  svg {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
  }

  path {
    fill: none;
    stroke-width: 3.7;
  }

  .track {
    stroke: rgba(230, 232, 239, 0.16);
  }

  .value {
    stroke: var(--color-yellow);
    stroke-linecap: round;
    transition:
      stroke-dasharray 200ms ease-out,
      stroke 200ms ease-out;
  }

  strong {
    color: var(--gray-900);
    font-size: 18px;
  }

  .urgent {
    animation: pulse-ring 900ms ease-out infinite;
  }

  .urgent .value {
    stroke: var(--color-danger);
  }
</style>
