# Vue

Load `@ponchia/ui` once in your Vite entry. Use the standard Vue lifecycle to
initialize vanilla behaviors after the element is mounted.

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { initThemeToggle, initDialog } from '@ponchia/ui/behaviors';
const root = ref(null);
let stops = [];
onMounted(() => {
  stops = [initThemeToggle({ root: root.value }), initDialog({ root: root.value })];
});
onBeforeUnmount(() => stops.forEach((stop) => stop()));
</script>

<template>
  <main ref="root" class="ui-stack">
    <button class="ui-button" data-bronto-theme-toggle>Toggle theme</button>
  </main>
</template>
```

Use the [integration guide](../integration.md) for the before-paint theme
script. Vue owns component state and rendering; Bronto owns CSS and delegated
behavior. Vue is a documented integration recipe, not a maintained packed
example in the current consumer matrix.
