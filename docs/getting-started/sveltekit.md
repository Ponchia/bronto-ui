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
individual leaves never inverts the cascade (README → "Leaf imports are
layer-safe").

## 2. No-flash theme (inline, in `app.html`)

`src/app.html` is emitted verbatim before hydration — put the script
there, not in a component:

```html
<!-- src/app.html, inside <head> -->
<script>
  try {
    var t = localStorage.getItem('bronto-theme');
    if (t) document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
```

## 3. Behaviors in `onMount` (with cleanup)

`init*` returns a cleanup; SvelteKit re-runs components on client-side
navigation, so always return it from `onMount`:

```svelte
<script>
  import { onMount } from 'svelte';
  import { initThemeToggle, initDialog } from '@ponchia/ui/behaviors';

  onMount(() => {
    const stop = [initThemeToggle(), initDialog()];
    return () => stop.forEach((fn) => fn());
  });
</script>
```

`toast()` is callable from any handler — no markup or mount needed.

## SSR caveats

- `@ponchia/ui/behaviors` is safe to import in a component that SSRs:
  import is side-effect-free and every `init*` no-ops without a DOM.
  Keeping the call inside `onMount` means it only ever runs client-side
  anyway.
- Do **not** call `initThemeToggle()` at module top level — it would run
  during SSR (no-op) and skip the real client wiring. Always `onMount`.
- The inline theme script in `app.html` is the only thing that must run
  before paint; everything else is post-hydration.
