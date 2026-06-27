<script>
  export let href = null;
  export let variant = 'primary';
  export let type = 'button';
  export let disabled = false;
  export let onclick = undefined;
  export let ariaLabel = undefined;
</script>

{#if href}
  <a
    class:secondary={variant === 'secondary'}
    class:ghost={variant === 'ghost'}
    class:success={variant === 'success'}
    class:danger={variant === 'danger'}
    class="button"
    {href}
    aria-label={ariaLabel}
  >
    <slot />
  </a>
{:else}
  <button
    class:secondary={variant === 'secondary'}
    class:ghost={variant === 'ghost'}
    class:success={variant === 'success'}
    class:danger={variant === 'danger'}
    class="button"
    {type}
    {disabled}
    {onclick}
    aria-label={ariaLabel}
  >
    <slot />
  </button>
{/if}

<style>
  .button {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    min-height: 48px;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-button);
    padding: 0 18px;
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-strong));
    color: white;
    font-weight: 900;
    text-decoration: none;
    box-shadow: var(--shadow-pop);
    transition:
      transform var(--duration-fast) var(--ease-pop),
      box-shadow var(--duration-fast) ease,
      background var(--duration-base) ease,
      border-color var(--duration-base) ease,
      color var(--duration-base) ease;
    user-select: none;
    white-space: nowrap;
  }

  .button::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.32), transparent);
    transform: translateX(-120%);
    transition: transform 500ms ease;
  }

  .button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 18px 34px rgba(255, 79, 121, 0.28);
  }

  .button:hover:not(:disabled)::after {
    transform: translateX(120%);
  }

  .button:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  .button:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 4px rgba(255, 79, 121, 0.20),
      var(--shadow-pop);
  }

  .secondary {
    border-color: rgba(255, 79, 121, 0.26);
    background: white;
    color: var(--color-accent);
    box-shadow: var(--shadow-soft);
  }

  .ghost {
    border-color: transparent;
    background: transparent;
    color: var(--gray-900);
    box-shadow: none;
  }

  .success {
    background: linear-gradient(135deg, var(--color-success), var(--color-mint));
    box-shadow: 0 14px 30px rgba(18, 130, 92, 0.22);
  }

  .danger {
    background: linear-gradient(135deg, var(--color-danger), var(--color-accent));
    box-shadow: 0 14px 30px rgba(217, 45, 85, 0.22);
  }

  .button:disabled {
    opacity: 0.56;
    box-shadow: none;
    transform: none;
  }

  @media (max-width: 520px) {
    .button {
      width: 100%;
      white-space: normal;
    }
  }
</style>
