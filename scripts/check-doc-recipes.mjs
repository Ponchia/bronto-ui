// Gate: a copy-paste `<script src>` CDN recipe in a SHIPPED doc must pin a
// jsDelivr `/build/*.min.js` UMD bundle, never a bare `cdn.jsdelivr.net/npm/
// <pkg>@N` redirect. The bare redirect resolves to an ES-module bundle that does
// NOT register the library's global (`window.vega` etc.), so a `<script src>`
// consumer's `vegaEmbed(...)` throws and nothing renders — and an autonomous LLM
// author copying the doc cannot self-correct it. This is exactly the class of
// bug the dogfood review found shipped dead in the Vega recipe; it can never be
// caught by the artifact-drift gates because docs are an UNTESTED surface, so it
// gets its own structural check.
//
// Scope, deliberately narrow to avoid false positives:
//   - Only `<script ... src="…">` tags. A `<link href>` to jsDelivr CSS (the
//     `dist/css/*` leaves) is fine — CSS has no global-registration problem.
//   - Only jsDelivr `/npm/<pkg>@<numeric-version>` URLs. A `@VERSION` placeholder
//     or a partial `@5` mentioned in prose/inline-code is not a `<script src>`.
//   - The URL must contain a `/build/` path segment (the UMD bundle path).
//
// Run: node scripts/check-doc-recipes.mjs
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shippedDocs } from './lib/shipped-docs.mjs';

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

for (const rel of shipped) {
  let text;
  try {
    text = readFileSync(resolve(root, rel), 'utf8');
  } catch {
    continue; // a missing listed doc is the pack gate's concern, not ours
  }
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(SCRIPT_SRC)) {
      const url = m[1];
      if (!JSDELIVR_PINNED.test(url)) continue; // not a pinned jsDelivr npm bundle
      if (!/\/build\//.test(url)) {
        problems.push(
          `${rel}:${i + 1}  <script src="${url}">  — bare jsDelivr bundle; ` +
            `pin the UMD build path, e.g. …@6.2.0/build/vega.min.js`,
        );
      }
    }
    for (const m of line.matchAll(GLYPH_TOKEN)) {
      problems.push(
        `${rel}:${i + 1}  references ${m[1]} — there is NO --glyph-* token; it ` +
          `resolves to nothing and the masked icon paints a solid square. Build ` +
          `the mask with renderGlyph(name, { render: 'mask' }).`,
      );
    }
  });
}

if (problems.length) {
  console.error(`✗ check:doc-recipes — ${problems.length} shipped-doc recipe(s) silently no-op:`);
  for (const p of problems) console.error(`    ${p}`);
  console.error(
    '  A bare cdn.jsdelivr.net/npm/<pkg>@N redirect serves a module bundle with no\n' +
      '  global (window.vega …), so a <script src> consumer renders nothing — pin the\n' +
      '  `/build/*.min.js` path. And var(--glyph-*) is not a token — use\n' +
      '  renderGlyph(name, { render: "mask" }). Fix the recipe, not the gate.',
  );
  process.exit(1);
}

console.log(
  `✓ check:doc-recipes — CDN <script src> recipes pin a /build/ UMD bundle; no phantom --glyph-* masks`,
);
