# Vanilla / Vite / plain HTML

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

`@ponchia/ui` ships a single flattened stylesheet. Point at it from
`node_modules` (or your CDN of choice):

```html
<head>
  <!-- 1. no-flash theme: inline, before the stylesheet -->
  <script>
    try {
      var t = localStorage.getItem('bronto-theme');
      if (t) document.documentElement.dataset.theme = t;
    } catch (e) {}
  </script>

  <!-- 2. the framework -->
  <link rel="stylesheet" href="/node_modules/@ponchia/ui/dist/bronto.css" />
</head>
<body>
  <button data-bronto-theme-toggle class="ui-themetoggle">Theme</button>

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
  <script>
    try {
      var t = localStorage.getItem('bronto-theme');
      if (t) document.documentElement.dataset.theme = t;
    } catch (e) {}
  </script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui/dist/bronto.css" />

  <!-- map the subpaths so `import … from '@ponchia/ui/…'` resolves on the CDN -->
  <script type="importmap">
    {
      "imports": {
        "@ponchia/ui/behaviors": "https://esm.sh/@ponchia/ui/behaviors",
        "@ponchia/ui/glyphs": "https://esm.sh/@ponchia/ui/glyphs",
        "@ponchia/ui/classes": "https://esm.sh/@ponchia/ui/classes"
      }
    }
  </script>
</head>
<body>
  <button data-bronto-theme-toggle class="ui-themetoggle">Theme</button>
  <script type="module">
    import { initThemeToggle } from '@ponchia/ui/behaviors';
    initThemeToggle();
  </script>
</body>
```

Pin a version in the URLs (`@ponchia/ui@0.4`) for production so a new
release can't shift under you.

## Theme without the module

If you don't want the behaviors module at all, the inline script above
is the entire theme story for a fixed theme. To let users toggle it,
either pull in `initThemeToggle()` or write the 3-line localStorage
toggle yourself — the contract is just `localStorage['bronto-theme'] =
'light' | 'dark'` and `<html data-theme>`.

## Notes

- Every `init*()` returns a cleanup function; in a long-lived page you
  rarely need it, but it exists for SPA route swaps.
- `toast(msg, { tone, title, duration })` needs no markup.
