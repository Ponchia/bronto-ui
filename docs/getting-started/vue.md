# Vue

```bash
npm i @ponchia/ui
```

## 1. Load the CSS

Load the CSS once in your app entry:

```js
// src/main.js
import '@ponchia/ui';
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

## 2. Scope behavior to the owning subtree

In SFCs, import the directives you use as local `vBronto*` bindings. Vue then
compiles `v-bronto-*` directly to those bindings, so the behavior stays
tree-shakeable and scoped to the component that owns the markup.

```vue
<script setup>
import { vThemeToggle as vBrontoThemeToggle } from '@ponchia/ui/vue';
</script>

<template>
  <main class="ui-center ui-stack" v-bronto-theme-toggle>
    <button class="ui-button" data-bronto-theme-toggle>Toggle theme</button>
  </main>
</template>
```

The directives are thin wrappers over `@ponchia/ui/behaviors`: they run on
mount, clean up before unmount, and restart when their binding value changes.
They do not define markup or component state.

You can also register individual directives globally:

```js
import { vDisclosure } from '@ponchia/ui/vue';

app.directive('bronto-disclosure', vDisclosure);
```

For app-wide installation, `brontoVue` registers the full directive set:

```js
import { brontoVue } from '@ponchia/ui/vue';

app.use(brontoVue);
```

Use the vanilla behavior layer directly when you need non-directive control:

```js
import { initThemeToggle } from '@ponchia/ui/behaviors';

const stop = initThemeToggle({ root: document.querySelector('#settings') });
// later
stop();
```
