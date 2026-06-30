<script>
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { pageTitle, siteMeta } from '$lib/config/site.js';

  export let status;
  export let error;

  $: title = pageTitle(error?.message || 'Page introuvable');
  $: description = 'Cette page Quizz Land est introuvable ou temporairement indisponible.';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="noindex,follow" />
  <meta name="theme-color" content={siteMeta.themeColor} />
  <meta property="og:site_name" content={siteMeta.name} />
  <meta property="og:locale" content={siteMeta.locale} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
</svelte:head>

<main class="page error-page">
  <section class="shell panel">
    <EmptyState
      icon={String(status || '!')}
      eyebrow="Quizz Land"
      title={error?.message || 'Page introuvable'}
      detail="Ce salon est introuvable ou temporairement indisponible."
      actionLabel="Retour à l’accueil"
      href="/"
    />
  </section>
</main>

<style>
  .error-page {
    display: grid;
    place-items: center;
  }

  .panel {
    width: min(640px, 100%);
  }

  @media (max-width: 520px) {
  }
</style>
