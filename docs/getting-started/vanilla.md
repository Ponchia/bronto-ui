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
