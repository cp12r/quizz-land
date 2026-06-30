<script>
  import { onMount } from 'svelte';
  import '$lib/styles/global.css';

  onMount(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // The app remains fully usable without the media cache.
    });
  });
</script>

<svelte:head>
  <link rel="stylesheet" href="/season-1/animations.css" />
</svelte:head>

<slot />
