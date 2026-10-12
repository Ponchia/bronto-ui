// Gate: copy-paste CDN recipes in SHIPPED docs must resolve to the intended
// browser assets.
//
// For `<script src>`, a pinned jsDelivr `/build/*.min.js` UMD bundle is required,
// never a bare `cdn.jsdelivr.net/npm/<pkg>@N` redirect. The bare redirect
// resolves to an ES-module bundle that does NOT register the library's global
// (`window.vega` etc.), so a `<script src>` consumer's `vegaEmbed(...)` throws
// and nothing renders — exactly the dogfood bug this gate was born from.
//
// For `<link rel="stylesheet">`, bare @ponchia/ui package specifiers never
// resolve in a browser. Use a real URL; pinned jsDelivr URLs must point at built
// `dist/` files. CSS @imports may use package specifiers through a bundler.
//
// Run: node scripts/check-doc-recipes.mjs
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shippedDocs } from './lib/shipped-docs.mjs';
import { stylesheetRecipeProblems } from './lib/doc-recipes.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

// Same shipped surface as check:versions — README, llms.txt, plus every `.md` in
// `files`.
const shipped = shippedDocs(pkg);

// `<script … src="…">` — capture the src URL. `[^>]*?` stays within the one tag.
const SCRIPT_SRC = /<script\b[^>]*?\ssrc=["']([^"']+)["']/gi;
// A jsDelivr npm URL pinned to a concrete X(.Y(.Z)) version.
const JSDELIVR_PINNED = /cdn\.jsdelivr\.net\/npm\/[^"'@\s]+@\d[\w.-]*/i;
// There is NO `--glyph-*` design token. A `var(--glyph-foo)` in `--icon-mask`
// (or anywhere) resolves to nothing and the masked icon paints a solid square —
// the exact legends.md C10 trap. The mask value comes from
// renderGlyph(name, { render: 'mask' }); flag any `var(--glyph-…)` recipe.
const GLYPH_TOKEN = /var\(\s*(--glyph-[\w-]*)/gi;

const problems = [];
const lineAt = (src, index) => src.slice(0, index).split('\n').length;

for (const rel of shipped) {
  let text;
  try {
    text = readFileSync(resolve(root, rel), 'utf8');
  } catch {
    continue; // a missing listed doc is the pack gate's concern, not ours
  }
  for (const m of text.matchAll(SCRIPT_SRC)) {
    const url = m[1];
    if (!JSDELIVR_PINNED.test(url)) continue; // not a pinned jsDelivr npm bundle
    if (!/\/build\//.test(url)) {
      problems.push(
        `${rel}:${lineAt(text, m.index)}  <script src="${url}">  — bare jsDelivr bundle; ` +
          `pin the UMD build path, e.g. …@6.2.0/build/vega.min.js`,
      );
    }
  }
  for (const { index, url, reason } of stylesheetRecipeProblems(text, pkg.version)) {
    problems.push(`${rel}:${lineAt(text, index)}  <link href="${url}"> — ${reason}`);
  }
  for (const m of text.matchAll(GLYPH_TOKEN)) {
    problems.push(
      `${rel}:${lineAt(text, m.index)}  references ${m[1]} — there is NO --glyph-* token; it ` +
        `resolves to nothing and the masked icon paints a solid square. Build ` +
        `the mask with renderGlyph(name, { render: 'mask' }).`,
    );
  }
}

const reporting = readFileSync(resolve(root, 'docs/reporting.md'), 'utf8');
for (const required of [
  `https://cdn.jsdelivr.net/npm/@ponchia/ui@${pkg.version}/dist/bronto.css`,
  `https://cdn.jsdelivr.net/npm/@ponchia/ui@${pkg.version}/dist/css/report-kit.css`,
]) {
  if (!reporting.includes(required)) {
    problems.push(`docs/reporting.md: CDN starter is missing ${required}`);
  }
}

if (problems.length) {
  console.error(`✗ check:doc-recipes — ${problems.length} shipped-doc recipe(s) silently no-op:`);
  for (const p of problems) console.error(`    ${p}`);
  console.error(
    '  A bare cdn.jsdelivr.net/npm/<pkg>@N redirect serves a module bundle with no\n' +
      '  global (window.vega …), so a <script src> consumer renders nothing — pin the\n' +
      '  `/build/*.min.js` path. Browser stylesheet links need real dist/ URLs, not\n' +
      '  package specifiers. And var(--glyph-*) is not a token — use\n' +
      '  renderGlyph(name, { render: "mask" }). Fix the recipe, not the gate.',
  );
  process.exit(1);
}

log(
  `✓ check:doc-recipes — script/link recipes target browser assets; no bare package hrefs or phantom --glyph-* masks`,
);
