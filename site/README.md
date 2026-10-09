# Bronto UI public website

A static documentation and product site built from Bronto UI itself. This
does not change package exports, introduce a frontend runtime, or replace the
existing testing fixtures.

**Authoring**

- `site/pages/*.html`: short editorial pages, linked with `{{root}}` so they
  can be served from either GitHub Pages' repository path or a custom origin.
- `site/site.css`, `site/site.js`: shared editorial shell, search, theme,
  responsive navigation, and HTML-copy enhancement.
- `site/components.mjs`: deliberately curated copyable specimens. Keep them
  aligned with their actual `.ui-*` names and link to the canonical docs.
- `docs/**/*.md`: the **single source** for all technical documents. The
  builder emits standalone HTML pages and a small client-side search index.
- `demo/*.html`: existing advanced fixtures / lab specimens; URLs retained.

`npm run site:build` creates `_site/`. This directory is not committed.
`npm run check:site` builds a fresh artifact in a temporary directory and
checks its critical routes and JavaScript import graph. The Pages workflow
publishes `_site/` only after the protected main CI succeeds.

When updating a public example, keep the screenshot in `site/assets/` in sync.
Screenshots are made from the real example routes, not independent mockups.


**Browser verification**

The Playwright web server assembles the Pages output before starting. Public
site regression tests use the local `/_site/` path and run in the existing
pinned Chromium/Firefox/WebKit CI matrix. They cover docs navigation, starter
and example routes, and the searchable, copyable catalog without querying the
live GitHub Pages deployment.


**What uses the library versus site-specific CSS**

The static shell imports the committed default Bronto UI bundle.
Component specimens and application demos use the real public `ui-*` classes.
`site/site.css` supplies a separate editorial/navigation layout and
website-specific spacing and colors, deliberately kept out of the npm package.
Do not cite the custom site shell as proof that a Bronto UI consumer needs no
application CSS. Prefer the actual runnable specimens to demonstrate the
library's reusable component contract.
