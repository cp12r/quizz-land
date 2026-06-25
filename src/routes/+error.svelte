<script>
  import Button from '$lib/components/Button.svelte';

  export let status;
  export let error;
</script>

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
    max-width: 560px;
    padding: 32px;
  }
</style>
