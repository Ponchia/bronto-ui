# Astro

```bash
npm i @ponchia/ui
```

## 1. Load the CSS (once, in your layout)

```astro
---
// src/layouts/Base.astro
import '@ponchia/ui';        // the flattened bundle (dist/bronto.css)
---
```

Importing the package from a `.astro` frontmatter or a global stylesheet
both work — Vite resolves the `.` export to the CSS bundle. The default bundle
already self-hosts Doto from the package's font files using relative URLs.
If you want to omit Doto, compose the individual CSS leaves without
`@ponchia/ui/css/fonts.css` and provide your own `--display` / `--dot-font`
family choices. See the [theming guide](../theming.md).

## 2. No-flash theme (inline, in `<head>`)

Astro renders `is:inline` scripts verbatim and unbundled, so they run
before paint — exactly what the theme needs:

```astro
<head>
  <meta name="color-scheme" content="light dark" />
  <script is:inline>
    try {
      var t = localStorage.getItem('bronto-theme');
      if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    } catch (e) {}
  </script>
</head>
```

Astro processes ordinary scripts as modules. Keeping this small script inline
in the document head lets it restore the saved theme before stylesheet paint;
a deferred module does not provide that guarantee.

## 3. Minimal styled markup

Start with the classes and attributes the CSS/behavior contracts expect:

```astro
<button type="button" data-bronto-theme-toggle class="ui-themetoggle__button">
  <span class="ui-themetoggle__prefix">Theme</span>
  <span class="ui-themetoggle__label">Dark</span>
  <span class="ui-themetoggle__track"><span class="ui-themetoggle__thumb"></span></span>
</button>
```

## 4. Behaviors in a browser script

Behaviors use the DOM, so call them in a browser script rather than server
frontmatter. A framework island is not required. Call the initializer after the
markup is in the DOM:

```astro
<script>
  import { initThemeToggle } from '@ponchia/ui/behaviors';
  initThemeToggle(); // SSR-safe; idempotent if the island re-runs
</script>
```

Use the same pattern for `initDialog`, `initTabs`, `initMenu`, or
`initDisclosure`. Astro's processed scripts run in the browser as modules;
they do not wait for every framework island to hydrate. If a React/Svelte/Solid
island creates the markup, initialize within that island's mount lifecycle and
retain cleanup, as shown in the [framework guide](react-solid.md).

With Astro's `ClientRouter`, a bundled script does not rerun on every navigation.
Use the router's `astro:page-load` event to initialize replaced markup and
`astro:before-swap` to clean up the previous behavior instances. A listener in a
shared layout can own this lifecycle; avoid adding another document listener on
every route. See Astro's official [script guide](https://docs.astro.build/en/guides/client-side-scripts/)
and [router lifecycle reference](https://docs.astro.build/en/guides/view-transitions/).

`toast(message, opts)` needs no markup — call it from any event handler;
it lazily creates a body-anchored, ARIA-live stack.

## SSR caveats

- The CSS is inert at SSR — no concern.
- `import '@ponchia/ui/behaviors'` is side-effect-free on import and
  every `init*` no-ops without a DOM, so importing it in code that also
  runs on the server will not crash. It just does nothing until called
  in the browser.
