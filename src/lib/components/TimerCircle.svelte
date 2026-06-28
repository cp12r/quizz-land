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
    border: 1px solid rgba(255, 250, 240, 0.18);
    border-radius: 50%;
    background: rgba(23, 21, 27, 0.72);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
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
    stroke: rgba(255, 250, 240, 0.16);
  }

  .value {
    stroke: var(--color-cyan);
    stroke-linecap: round;
    transition:
      stroke-dasharray 200ms ease-out,
      stroke 200ms ease-out;
  }

  strong {
    color: #fffaf0;
    font-size: 18px;
  }

  .urgent {
    animation: pulse-ring 900ms ease-out infinite;
  }

  .urgent .value {
    stroke: var(--color-danger);
  }
</style>
