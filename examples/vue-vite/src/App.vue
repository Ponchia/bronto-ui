<script setup>
import { ref } from 'vue';
import {
  toast,
  vDialog as vBrontoDialog,
  vDotGlyph as vBrontoDotGlyph,
  vTabs as vBrontoTabs,
  vThemeToggle as vBrontoThemeToggle,
} from '@ponchia/ui/vue';

const bindingsEnabled = ref(true);
const bindingsDisabled = { root: null };

function notify() {
  toast('Hello from @ponchia/ui/vue', { tone: 'success' });
}
</script>

<template>
  <button hidden data-smoke-outside-scope data-bronto-theme-toggle>
    Outside scoped theme toggle
  </button>

  <main
    class="ui-center ui-stack"
    style="padding-block: 3rem"
    v-bronto-theme-toggle="bindingsEnabled ? undefined : bindingsDisabled"
    v-bronto-dialog="bindingsEnabled ? undefined : bindingsDisabled"
    v-bronto-tabs="bindingsEnabled ? undefined : bindingsDisabled"
    v-bronto-dot-glyph="bindingsEnabled ? undefined : bindingsDisabled"
  >
    <button hidden data-bindings-disable type="button" @click="bindingsEnabled = false">
      Disable bindings
    </button>
    <span hidden data-bindings-state>
      {{ bindingsEnabled ? 'enabled' : 'disabled' }}
    </span>
    <p class="ui-eyebrow">@ponchia/ui</p>
    <h1>Vue + Vite</h1>
    <div class="ui-cluster">
      <button class="ui-button" data-bronto-theme-toggle>Toggle theme</button>
      <button class="ui-button ui-button--subtle" type="button" @click="notify">Toast</button>
      <button class="ui-button ui-button--ghost" type="button" data-bronto-open="vueDlg">
        Open dialog
      </button>
    </div>

    <div data-bronto-tabs class="ui-tabs">
      <div class="ui-tabs__list" aria-label="Vue tabs">
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

    <dialog id="vueDlg" class="ui-modal" data-bronto-dialog-light>
      <form method="dialog" class="ui-stack">
        <h2>Vue directive</h2>
        <p class="ui-muted">Dialog behavior is scoped to the Vue root directive.</p>
        <button class="ui-button" data-bronto-close type="button">Close</button>
      </form>
    </dialog>
  </main>
</template>
