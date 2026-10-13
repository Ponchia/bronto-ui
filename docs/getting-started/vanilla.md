# Vanilla / Vite / plain HTML

**First time here?** Follow the [first-component walkthrough](first-component.md) for a complete working page, then return for behavior imports and CDN options.

```bash
npm i @ponchia/ui
```

## With a bundler (Vite, esbuild, Parcel)

```js
// main.js
import '@ponchia/ui'; // CSS bundle
import { initThemeToggle, initDialog, toast } from '@ponchia/ui/behaviors';

initThemeToggle();
initDialog();
```

That root import is a CSS side-effect import. It belongs in bundlers that
understand CSS package exports; Node/runtime JS should import only explicit
subpaths such as `@ponchia/ui/behaviors`.

## Plain HTML, no bundler

`@ponchia/ui` ships a flattened default stylesheet. Serve the package from a
local HTTP server and point at its files, or use the CDN recipe below. The local
recipe assumes your server exposes `/node_modules/@ponchia/ui/`; that path is
not automatically available on a deployed site.

```html
<head>
  <meta name="color-scheme" content="light dark" />
  <!-- 1. no-flash theme: inline, before the stylesheet -->
  <script>
    try {
      var t = localStorage.getItem('bronto-theme');
      if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    } catch (e) {}
  </script>

  <!-- 2. the framework -->
  <link rel="stylesheet" href="/node_modules/@ponchia/ui/dist/bronto.css" />
</head>
<body>
  <button type="button" data-bronto-theme-toggle class="ui-themetoggle__button">
    <span class="ui-themetoggle__prefix">Theme</span>
    <span class="ui-themetoggle__label">Dark</span>
    <span class="ui-themetoggle__track"><span class="ui-themetoggle__thumb"></span></span>
  </button>

  <!-- 3. behaviors as an ES module -->
  <script type="module">
    import { initThemeToggle } from '/node_modules/@ponchia/ui/behaviors/index.js';
    initThemeToggle();
  </script>
</body>
```

The font `@font-face` URLs in the bundle are relative to the package, so
serving `node_modules/@ponchia/ui/` (or copying `dist/` + `fonts/`
together) resolves them with no `/fonts` path assumption.

## CDN + import map (no install, no build)

Because the package is pure ESM + CSS, you can load it straight from a CDN
(jsdelivr/esm.sh) and resolve the JS subpaths with a native
[import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) —
no `node_modules`, no bundler:

```html
<head>
  <meta name="color-scheme" content="light dark" />
  <script>
    try {
      var t = localStorage.getItem('bronto-theme');
      if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    } catch (e) {}
  </script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.16.3/dist/bronto.css" />

  <!-- map the subpaths so `import … from '@ponchia/ui/…'` resolves on the CDN -->
  <script type="importmap">
    {
      "imports": {
        "@ponchia/ui/behaviors": "https://esm.sh/@ponchia/ui@0.16.3/behaviors",
        "@ponchia/ui/glyphs": "https://esm.sh/@ponchia/ui@0.16.3/glyphs",
        "@ponchia/ui/classes": "https://esm.sh/@ponchia/ui@0.16.3/classes"
      }
    }
  </script>
</head>
<body>
  <button type="button" data-bronto-theme-toggle class="ui-themetoggle__button">
    <span class="ui-themetoggle__prefix">Theme</span>
    <span class="ui-themetoggle__label">Dark</span>
    <span class="ui-themetoggle__track"><span class="ui-themetoggle__thumb"></span></span>
  </button>
  <script type="module">
    import { initThemeToggle } from '@ponchia/ui/behaviors';
    initThemeToggle();
  </script>
</body>
```

Pin a version in the URLs (`@ponchia/ui@0.16.3`) for production so a new
release can't shift under you.

## Theme without the module

Without an explicit `data-theme`, CSS follows the operating-system preference.
A fixed `<html data-theme="light">` or `"dark"` needs no JavaScript. The inline
script restores a previously stored choice. For a user-facing switch,
`initThemeToggle()` also persists the choice, reflects `aria-pressed`, and emits
`bronto:themechange`; retain those behaviors if you implement a custom control.

## Notes

- Every `init*()` returns a cleanup function; in a long-lived page you
  rarely need it, but it exists for SPA route swaps.
- `toast(msg, { tone, title, duration })` needs no markup.
