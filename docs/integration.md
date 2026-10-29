# Integration

`@ponchia/ui` is CSS-first and framework-agnostic. Integrating it into
any app starts with CSS. Theme persistence and JavaScript behavior are optional:

1. **Load the CSS.** `@import '@ponchia/ui';` (the flattened bundle) or
   `@import '@ponchia/ui/css';` (the leaf fan-out, through a bundler).
   Everything is inside `@layer bronto`, so un-layered app CSS wins
   without `!important` — see [Tailwind / cascade-layer interop](interop/tailwind.md).
2. **Apply the theme before paint** to avoid a flash. The persisted
   theme lives in `localStorage['bronto-theme']`; a tiny **inline**
   head script must set `<html data-theme>` _before_ first paint. This
   matters only when restoring an explicit user choice. Without persistence,
   CSS follows the operating-system color preference.
3. **Wire behaviors in the framework's lifecycle.** Every `init*()` is
   SSR-safe (no-ops without a DOM), idempotent, and returns a cleanup
   function. Call it on mount, call the cleanup on unmount. Scope `root` to the
   component when possible, and let one owner manage a control's interaction.
   `toast()` returns a dismiss function; `applyStoredTheme()` returns nothing.

## The no-flash theme script (framework-agnostic)

Inline, render-blocking, in `<head>`, before any stylesheet-dependent
paint. No import — it must run before module JS:

```html
<meta name="color-scheme" content="light dark" />
<script>
  try {
    var t = localStorage.getItem('bronto-theme');
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
```

The meta declaration lets browser-owned form controls and chrome advertise and
render both supported schemes; it does not replace the stored-theme script.

`applyStoredTheme()` from `@ponchia/ui/behaviors` does exactly this
(default `storageKey: 'bronto-theme'`) and is what `initThemeToggle()`
persists to. Module execution is deferred and does not guarantee application
before first paint; use the **inline** copy above for that purpose. Use `applyStoredTheme()` for re-application after
client navigation.

## Per-framework guides

- [Astro](getting-started/astro.md)
- [SvelteKit](getting-started/sveltekit.md)
- [Vue](getting-started/vue.md)
- [Vanilla / Vite / plain HTML](getting-started/vanilla.md)
- [React / Solid / Qwik](getting-started/react-solid.md) (host lifecycle recipes)
- [Tailwind / cascade-layer interop](interop/tailwind.md)

All behaviors and their attributes are typed in `@ponchia/ui/behaviors`
(`behaviors/index.d.ts`); the README quick-start shows the common ones.

## Related Bronto projects

Choose a project for the job it owns. These repositories share a maintainer
and some visual conventions, not a required installation or a common release
number. Bronto UI keeps zero runtime dependencies; linking to another project
does not add it to the stylesheet or package.

| Need | Project | What your application still owns |
| --- | --- | --- |
| Style an interface or report | Bronto UI: the styles, tokens and optional behaviors described here | Content, application state, data access and routing |
| Position explanatory notes around an existing visual | [Bronto Annotations](https://github.com/Ponchia/bronto-annotations) | The chart or diagram, measured anchors, saved annotations and editing policy |
| Test alignment, spacing and containment | [Bronto Layout](https://github.com/Ponchia/bronto-layout) | Approved relationships, intentional browser state and the decision to change a layout |
| Keep editable visual content separate from its views | [Bronto Visual Models](https://github.com/Ponchia/bronto-visual-models) | Persistence, authorization, data sources and placement in the application |

Annotations explains an existing visual; Visual Models owns authored visual
content and its guarded edits. Layout checks measured relationships; it does
not arrange a graph or replace rendering and accessibility tests. Bronto UI
provides their optional presentation vocabulary without taking ownership of
these separate domains. None requires a particular canvas application.

Outside the browser libraries, [Bronto TUI](https://github.com/Ponchia/bronto-tui)
uses the design tokens in Python/Textual.
[Bronto Pulse](https://github.com/Ponchia/bronto-pulse) is a separate project
analytics application with private data and deployment; it is not a UI
dependency or an analytics service enabled by installing Bronto UI.

Each repository owns its installation instructions, maturity statement and
release evidence. Follow those instructions: source versions and GitHub beta
archives are not proof that an npm version exists. Install only the projects
and renderer adapters your application needs. Qualify their published artifacts
together in your own application, including their peer requirements; a shared
name does not promise compatibility across every version.
