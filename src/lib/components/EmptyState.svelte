<script>
  export let icon = '!';
  export let eyebrow = 'QuizzLand';
  export let title = 'Action impossible';
  export let detail = '';
  export let actionLabel = '';
  export let href = '';
  export let onAction = null;
</script>

<section class="empty-state" role="status">
  <span class="empty-icon" aria-hidden="true">{icon}</span>
  <div>
    <p class="mono">{eyebrow}</p>
    <h2>{title}</h2>
    {#if detail}<span class="detail">{detail}</span>{/if}
  </div>
  {#if actionLabel}
    {#if href}
      <a class="empty-action" {href}>{actionLabel}</a>
    {:else}
      <button type="button" class="empty-action" on:click={onAction}>{actionLabel}</button>
    {/if}
  {/if}
</section>

<style>
  .empty-state {
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 8px;
    padding: 18px;
    background:
      linear-gradient(135deg, rgba(230, 232, 239, 0.1), rgba(230, 232, 239, 0.035)),
      rgba(11, 16, 32, 0.76);
    color: #e6e8ef;
    box-shadow: 0 24px 62px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(16px);
  }

  .empty-icon {
    display: grid;
    width: 58px;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgba(255, 213, 74, 0.28);
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(255, 213, 74, 0.22), rgba(229, 57, 53, 0.16));
    color: #ffd54a;
    font-weight: 950;
  }

  p,
  h2,
  .detail {
    margin: 0;
  }

  p {
    color: #ffd54a;
    font-size: 0.72rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  h2 {
    margin-top: 4px;
    color: #e6e8ef;
    font-size: clamp(1.25rem, 4vw, 2rem);
    line-height: 1;
    text-transform: uppercase;
  }

  .detail {
    display: block;
    margin-top: 8px;
    color: rgba(230, 232, 239, 0.72);
    font-weight: 800;
  }

  .empty-action {
    display: inline-grid;
    min-height: 44px;
    place-items: center;
    border: 1px solid rgba(230, 232, 239, 0.18);
    border-radius: 8px;
    background: #e6e8ef;
    color: #0b1020;
    padding: 0 14px;
    font-weight: 950;
    text-decoration: none;
    text-transform: uppercase;
  }

  @media (max-width: 620px) {
    .empty-state {
      grid-template-columns: 48px minmax(0, 1fr);
    }

    .empty-icon {
      width: 48px;
    }

    .empty-action {
      grid-column: 1 / -1;
      width: 100%;
    }
  }
</style>
