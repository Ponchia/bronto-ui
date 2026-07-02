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
both work — Vite resolves the `.` export to the CSS bundle. To self-host
the Doto font, import the `@ponchia/ui/css/<leaf>.css` files you need and
skip `@ponchia/ui/css/fonts.css`, overriding `--display` / `--dot-font`
(see README → Browser support).

## 2. No-flash theme (inline, in `<head>`)

Astro renders `is:inline` scripts verbatim and unbundled, so they run
before paint — exactly what the theme needs:

```astro
<head>
  <script is:inline>
    try {
      var t = localStorage.getItem('bronto-theme');
      if (t) document.documentElement.dataset.theme = t;
    } catch (e) {}
  </script>
</head>
```

Without `is:inline` Astro would hoist/bundle it and you'd get a flash.

## 3. Minimal styled markup

Start with the classes and attributes the CSS/behavior contracts expect:

```astro
<button type="button" data-bronto-theme-toggle class="ui-themetoggle__button">
  <span class="ui-themetoggle__prefix">Theme</span>
  <span class="ui-themetoggle__label">Dark</span>
  <span class="ui-themetoggle__track"><span class="ui-themetoggle__thumb"></span></span>
</button>
```

## 4. Behaviors in islands

Behaviors are DOM glue, so they belong in a client-side island, not in
server frontmatter. Call the initializer after the markup is in the DOM:

```astro
<script>
  import { initThemeToggle } from '@ponchia/ui/behaviors';
  initThemeToggle(); // SSR-safe; idempotent if the island re-runs
</script>
```

For `initDialog` / `initTabs` / `initMenu` / `initDisclosure`, do the
same — call once after the markup is in the DOM. Astro `<script>` tags
run after hydration and only in the browser, so the SSR-safety is
belt-and-braces here, but it matters if you move the call into a
framework island (React/Svelte/Solid) that also runs server-side — then
keep the cleanup (see the React/Solid guide).

`toast(message, opts)` needs no markup — call it from any event handler;
it lazily creates a body-anchored, ARIA-live stack.

## SSR caveats

- The CSS is inert at SSR — no concern.
- `import '@ponchia/ui/behaviors'` is side-effect-free on import and
  every `init*` no-ops without a DOM, so importing it in code that also
  runs on the server will not crash. It just does nothing until called
  in the browser.
