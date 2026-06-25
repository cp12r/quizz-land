<script>
  export let href = null;
  export let variant = 'primary';
  export let type = 'button';
  export let disabled = false;
  export let onclick = undefined;
</script>

{#if href}
  <a class:secondary={variant === 'secondary'} class:ghost={variant === 'ghost'} class="button" {href}>
    <slot />
  </a>
{:else}
  <button class:secondary={variant === 'secondary'} class:ghost={variant === 'ghost'} class="button" {type} {disabled} {onclick}>
    <slot />
  </button>
{/if}

<style>
  .button {
    display: inline-flex;
    min-height: 48px;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-button);
    padding: 0 18px;
    background: var(--color-accent);
    color: white;
    font-weight: 700;
    text-decoration: none;
    transition: background 200ms ease-out, border-color 200ms ease-out, color 200ms ease-out;
  }

  .button:hover,
  .button:focus-visible {
    background: #c9364d;
    border-color: #c9364d;
  }

  .secondary {
    background: white;
    color: var(--color-accent);
  }

  .ghost {
    border-color: transparent;
    background: transparent;
    color: var(--gray-900);
  }

  .button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
</style>
