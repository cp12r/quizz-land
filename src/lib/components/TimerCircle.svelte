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
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: var(--shadow-soft);
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
    stroke: var(--gray-200);
  }

  .value {
    stroke: var(--color-cyan);
    stroke-linecap: round;
    transition:
      stroke-dasharray 200ms ease-out,
      stroke 200ms ease-out;
  }

  strong {
    color: var(--color-ink);
    font-size: 18px;
  }

  .urgent {
    animation: pulse-ring 900ms ease-out infinite;
  }

  .urgent .value {
    stroke: var(--color-danger);
  }
</style>
