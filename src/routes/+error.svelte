<script>
  import Button from '$lib/components/Button.svelte';
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
  <meta property="og:site_name" content={siteMeta.name} />
  <meta property="og:locale" content={siteMeta.locale} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
</svelte:head>

<main class="page error-page">
  <section class="shell card panel">
    <p class="mono">{status}</p>
    <h1>{error?.message || 'Page introuvable'}</h1>
    <Button href="/">Retour accueil</Button>
  </section>
</main>

<style>
  .error-page {
    display: grid;
    place-items: center;
  }

  .panel {
    display: grid;
    width: min(560px, 100%);
    gap: 18px;
    padding: 32px;
  }

  p,
  h1 {
    margin: 0;
  }

  p {
    color: var(--color-accent);
    font-weight: 900;
  }

  h1 {
    font-size: 2.6rem;
  }

  @media (max-width: 520px) {
    .panel {
      padding: 22px;
    }

    h1 {
      font-size: 2rem;
    }
  }
</style>
