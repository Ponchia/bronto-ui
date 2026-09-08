<script>
  import { onMount } from 'svelte';
  import { initDialog, initDotGlyph, initTabs, initThemeToggle, toast } from '@ponchia/ui/behaviors';
  let root;
  let bindingsEnabled = true;
  let stops = [];
  function disableBindings() {
    stops.forEach((stop) => stop());
    stops = [];
    bindingsEnabled = false;
  }
  onMount(() => {
    stops = [initThemeToggle({ root }), initDialog({ root }), initTabs({ root }), initDotGlyph({ root })];
    return disableBindings;
  });
  function notify() {
    toast('Hello from Svelte', { tone: 'success' });
  }
</script>

<button hidden data-smoke-outside-scope data-bronto-theme-toggle>
  Outside scoped theme toggle
</button>

<main
  bind:this={root}
  class="ui-center ui-stack"
  style="padding-block: 3rem"
>
  <button hidden data-bindings-disable type="button" on:click={disableBindings}>
    Disable bindings
  </button>
  <span hidden data-bindings-state>
    {bindingsEnabled ? 'enabled' : 'disabled'}
  </span>
  <p class="ui-eyebrow">@ponchia/ui</p>
  <h1>SvelteKit</h1>
  <div class="ui-cluster">
    <button class="ui-button" data-bronto-theme-toggle>Toggle theme</button>
    <button class="ui-button ui-button--subtle" type="button" on:click={notify}>Toast</button>
    <button class="ui-button ui-button--ghost" type="button" data-bronto-open="svelteDlg">
      Open dialog
    </button>
  </div>

  <div data-bronto-tabs class="ui-tabs">
    <div class="ui-tabs__list" aria-label="Svelte tabs">
      <button class="ui-tab is-active" data-tab="one" type="button">One</button>
      <button class="ui-tab" data-tab="two" type="button">Two</button>
    </div>
    <section class="ui-tabs__panel" data-panel="one">
      <span data-bronto-glyph="spark" data-bronto-glyph-label="spark"></span>
    </section>
    <section class="ui-tabs__panel" data-panel="two">
      <span
        data-bronto-glyph="check-circle"
        data-bronto-glyph-render="mask"
        data-bronto-glyph-label="check"
      ></span>
    </section>
  </div>

  <dialog
    id="svelteDlg"
    class="ui-modal"
    data-bronto-dialog-light
    aria-label="Svelte example dialog"
  >
    <form method="dialog" class="ui-stack">
      <h2>Svelte lifecycle</h2>
      <p class="ui-muted">Dialog behavior is scoped to the Svelte lifecycle root.</p>
      <button class="ui-button" data-bronto-close type="button">Close</button>
    </form>
  </dialog>
</main>
