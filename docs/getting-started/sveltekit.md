# SvelteKit

```bash
npm i @ponchia/ui
```

## 1. Load the CSS (root layout)

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '@ponchia/ui';
</script>

<slot />
```

Per-route CSS splitting is safe: every `@ponchia/ui/css/<leaf>.css`
export is self-wrapped in `@layer bronto`, so mixing the bundle with
individual leaves keeps the same framework layer. See
[cascade-layer interop](../interop/tailwind.md).

## 2. No-flash theme (inline, in `app.html`)

`src/app.html` is emitted verbatim before hydration — put the script
there, not in a component:

```html
<!-- src/app.html, inside <head> -->
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

```svelte
<main class="ui-center ui-stack">
  <button class="ui-button" data-bronto-theme-toggle>Toggle theme</button>
</main>
```

## 4. Behaviors in `onMount` (with cleanup)

`init*` returns a cleanup; SvelteKit re-runs components on client-side
navigation, so always return it from `onMount`:

```svelte
<script>
  import { onMount } from 'svelte';
  import { initThemeToggle } from '@ponchia/ui/behaviors';
  let root;

  onMount(() => {
    return initThemeToggle({ root });
  });
</script>

<main bind:this={root} class="ui-center ui-stack">
  <button type="button" class="ui-button" data-bronto-theme-toggle>Toggle theme</button>
</main>
```

Use the same scoped mount/cleanup pattern for other initializers. The snippet
uses Svelte's supported legacy component syntax, as does the maintained example.
`toast()` is callable from a client-side event handler and creates its own markup;
it returns a dismiss function.

## SSR caveats

- `@ponchia/ui/behaviors` is safe to import in a component that SSRs:
  import is side-effect-free and every `init*` no-ops without a DOM.
  Keeping the call inside `onMount` means it only ever runs client-side
  anyway.
- Do **not** call `initThemeToggle()` at module top level — it would run
  during SSR (no-op) and skip the real client wiring. Always `onMount`.
- The inline theme script in `app.html` is the only thing that must run
  before paint; everything else is post-hydration.
