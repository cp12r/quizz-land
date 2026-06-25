<script>
  export let remaining = 0;
  export let total = 30;

  $: progress = total ? Math.max(0, Math.min(1, remaining / total)) : 0;
  $: dash = `${Math.round(progress * 100)} 100`;
</script>

<div class="timer" aria-label={`${remaining} secondes restantes`}>
  <svg viewBox="0 0 36 36">
    <path class="track" d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 0 1 0-31" />
    <path class="value" stroke-dasharray={dash} d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 0 1 0-31" />
  </svg>
  <strong class="mono">{remaining}</strong>
</div>

<style>
  .timer {
    position: relative;
    width: 88px;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
  }

  svg {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
  }

  path {
    fill: none;
    stroke-width: 3.5;
  }

  .track {
    stroke: var(--gray-200);
  }

  .value {
    stroke: var(--color-accent);
    stroke-linecap: round;
    transition: stroke-dasharray 200ms ease-out;
  }
</style>
