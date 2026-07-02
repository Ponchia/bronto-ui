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

## 3. Minimal styled markup

Start with the classes and attributes the CSS/behavior contracts expect:

```svelte
<main class="ui-center ui-stack">
  <button class="ui-button" data-bronto-theme-toggle>Toggle theme</button>
</main>
```

## 4. Behaviors as Svelte actions

The optional `@ponchia/ui/svelte` entrypoint exports Svelte actions over the
same vanilla behavior layer. Attach the action to the subtree that owns the
markup:

```svelte
<script>
  import { themeToggle, dialog } from '@ponchia/ui/svelte';
</script>

<main class="ui-center ui-stack" use:themeToggle use:dialog>
  <button class="ui-button" data-bronto-theme-toggle>Toggle theme</button>
</main>
```

Actions scope delegated behavior to their node and clean up automatically when
the component is destroyed or the action parameter changes.

The action surface maps one-for-one to delegated behaviors: `themeToggle`,
`dismissible`, `disabledGuard`, `disclosure`, `menu`, `formValidation`,
`combobox`, `popover`, `tableSort`, `tabs`, `dialog`, `modal`, `carousel`,
`dotGlyph`, `legend`, `connectors`, `spotlight`, `crosshair`, `command`,
`sources`, and `splitter`. The hook-style aliases (`useThemeToggle`,
`useDialog`, etc.) point at the same actions. For custom behavior glue, use
`createBrontoAction(init)` or the generic `brontoBehavior` /
`useBrontoBehavior` action. `toast()` / `useToast()` expose the imperative
toast helper.

## 5. Behaviors in `onMount` (with cleanup)

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
