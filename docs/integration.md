# Integration

`@ponchia/ui` is CSS-first and framework-agnostic. Integrating it into
any app is three concerns, the same everywhere:

1. **Load the CSS.** `@import '@ponchia/ui';` (the flattened bundle) or
   `@import '@ponchia/ui/css';` (the leaf fan-out, through a bundler).
   Everything is inside `@layer bronto`, so un-layered app CSS wins
   without `!important` — see [Tailwind / cascade-layer interop](interop/tailwind.md).
2. **Apply the theme before paint** to avoid a flash. The persisted
   theme lives in `localStorage['bronto-theme']`; a tiny **inline**
   head script must set `<html data-theme>` _before_ first paint. This
   is the single most-missed pattern — every guide below shows it.
3. **Wire behaviors in the framework's lifecycle.** Every `init*()` is
   SSR-safe (no-ops without a DOM), idempotent, and returns a cleanup
   function. Call it on mount, call the cleanup on unmount.

## The no-flash theme script (framework-agnostic)

Inline, render-blocking, in `<head>`, before any stylesheet-dependent
paint. No import — it must run before module JS:

```html
<script>
  try {
    var t = localStorage.getItem('bronto-theme');
    if (t) document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
```

`applyStoredTheme()` from `@ponchia/ui/behaviors` does exactly this
(default `storageKey: 'bronto-theme'`) and is what `initThemeToggle()`
persists to — but module code runs after paint, so the **inline** copy
above is the FOUC fix. Use `applyStoredTheme()` for re-application after
client navigation.

## Per-framework guides

- [Astro](getting-started/astro.md)
- [SvelteKit](getting-started/sveltekit.md)
- [Vue](getting-started/vue.md)
- [Vanilla / Vite / plain HTML](getting-started/vanilla.md)
- [React / Solid / Qwik](getting-started/react-solid.md) (optional thin bindings,
  not component packages)
- [Tailwind / cascade-layer interop](interop/tailwind.md)

All behaviors and their attributes are typed in `@ponchia/ui/behaviors`
(`behaviors/index.d.ts`); the README quick-start shows the common ones.
