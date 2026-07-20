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

## 2. No-flash theme (inline, in `index.html`)

Put the theme script in `index.html` so it runs before Vue mounts:

```html
<!-- index.html, inside <head> -->
<meta name="color-scheme" content="light dark" />
<script>
  try {
    var t = localStorage.getItem('bronto-theme');
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
```

## 3. Minimal styled markup

Start with the classes and attributes the CSS/behavior contracts expect:

```vue
<template>
  <main class="ui-center ui-stack">
    <button class="ui-button" data-bronto-theme-toggle>Toggle theme</button>
  </main>
</template>
```

## 4. Deprecated compatibility directives

The `@ponchia/ui/vue` directive entrypoint remains compatible in 0.7 but is
deprecated for removal no earlier than 0.8. Prefer the vanilla lifecycle recipe
below. During migration, import directives as local `vBronto*` bindings. Vue then
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

The directive exports map one-for-one to delegated behaviors: `vThemeToggle`,
`vDismissible`, `vDisabledGuard`, `vDisclosure`, `vMenu`, `vFormValidation`,
`vCombobox`, `vPopover`, `vTableSort`, `vTabs`, `vDialog`, `vModal`,
`vCarousel`, `vDotGlyph`, `vLegend`, `vConnectors`, `vSpotlight`,
`vCrosshair`, `vCommand`, `vSources`, and `vSplitter`. `brontoVue` registers
that full set as both kebab-case (`v-bronto-theme-toggle`) and camel-case
directive names. `toast()` and `useToast()` expose the same imperative toast
helper for event handlers.

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

Use the vanilla behavior layer directly for the stable path:

```js
import { initThemeToggle } from '@ponchia/ui/behaviors';

const stop = initThemeToggle({ root: document.querySelector('#settings') });
// later
stop();
```
