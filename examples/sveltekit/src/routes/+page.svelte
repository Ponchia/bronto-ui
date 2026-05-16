<script>
  import { onMount } from 'svelte';
  import { initThemeToggle } from '@ponchia/ui/behaviors';

  onMount(() => {
    const stop = initThemeToggle();
    return () => stop(); // SvelteKit re-runs on client nav → always clean up
  });
</script>

<main class="ui-center" style="padding: 3rem 0">
  <p class="ui-eyebrow">@ponchia/ui</p>
  <h1>SvelteKit</h1>
  <button class="ui-button" data-bronto-theme-toggle>Toggle theme</button>
</main>
