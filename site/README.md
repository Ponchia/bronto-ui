# Bronto UI public website

The public site is generated static HTML built with Bronto UI. Its editorial
shell and technical documentation are maintained separately from the regression
fixtures, which remain accessible under their original `demo/` URLs.

## Authoring map

| Source | Owns |
| --- | --- |
| `site/pages/*.html` | Product pages; use `{{root}}` for paths that work beneath GitHub Pages' repository prefix. |
| `site/site.css`, `site/site.js` | Website layout, theme control, responsive navigation, search, and code-copy enhancements. |
| `site/components.mjs` | Curated copyable specimens that use the default package CSS. |
| `site/examples.mjs` | Shared example descriptions, real demo/source routes, and screenshot filenames. |
| `docs/**/*.md` | Canonical technical documents, rendered as individual pages with stable heading IDs. |
| `demo/` | Runnable application/report examples and focused regression specimens. |

## Build and verify

```sh
npm run site:build
npm run check:site
node scripts/serve.mjs 8123
```

Open `http://127.0.0.1:8123/_site/`. `_site/` is generated and ignored by Git.
The builder resets that directory on each run. A custom destination must be new,
empty, or a previously marked Bronto UI site output; it refuses repository source
and unrelated nonempty folders.

`check:site` creates a fresh temporary build and verifies the published module
imports, assets, documentation links and section anchors, source links, search
index, and copyable component contracts. Repository-level Markdown links open
on GitHub; technical documents have standalone HTML routes. The complete authored
document content is searchable, including sections near the end of long references.

Playwright tests use the generated `/_site/` artifact and exercise desktop/mobile
navigation, documentation deep links, search recovery, code copying, examples,
and navigation without JavaScript. Use the repository browser commands in
[CONTRIBUTING.md](../CONTRIBUTING.md); the Pages workflow publishes only a main
commit with successful CI, including manual dispatches.

## Refresh example screenshots

```sh
npm run site:screenshots
```

This captures the actual routes listed in `site/examples.mjs` in Chromium at
1200 × 720, waits for fonts, and writes the three JPEG previews in `site/assets/`.
The capture server uses an ephemeral port and closes along with the browser.
Review the images before committing them. For a disposable review, pass an output
directory: `npm run site:screenshots -- /tmp/bronto-ui-previews`.

These are website preview images. The regression PNG baselines under
`test/e2e/__screenshots__/` follow the pinned-container workflow documented in
CONTRIBUTING. `social.jpg` is the separately maintained sharing image.

## What the examples prove

The shell imports the committed default Bronto UI bundle. Component specimens
and application demos use the public `ui-*` classes. `site/site.css` supplies
website-specific layout, spacing, and colors; it is not part of the npm package.
Use the runnable specimens to evaluate the reusable contract, and expect an
application to supply its own content, state, logic, and composition CSS.
