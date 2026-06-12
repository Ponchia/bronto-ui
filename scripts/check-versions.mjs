// Gate: every hard-coded `@ponchia/ui@X.Y.Z[-prerelease]` version literal in a SHIPPED doc
// must equal the current package version. These CDN/import snippets ship in the
// tarball and are the primary entrypoint for LLM and copy-paste consumers, so a
// stale `@0.5.0` in a 0.6.0 release would hand them a stylesheet that no longer
// matches the JS surface they read from node_modules. (Partial pins like
// `@ponchia/ui@0.4` — a deliberate "pin a major" example — are not exact X.Y.Z
// literals and are intentionally NOT gated.)
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shippedDocs } from './lib/shipped-docs.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const version = pkg.version;

// The shipped surfaces that may carry version literals: npm's always-included
// README, llms.txt, plus every `.md` listed in package.json `files` (docs ship
// in the tarball).
const shipped = shippedDocs(pkg);

const EXACT = /@ponchia\/ui@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/g;
const problems = [];

for (const rel of shipped) {
  let text;
  try {
    text = readFileSync(resolve(root, rel), 'utf8');
  } catch {
    continue; // a listed doc that doesn't exist is the pack gate's concern, not ours
  }
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(EXACT)) {
      if (m[1] !== version) {
        problems.push(`${rel}:${i + 1}  @ponchia/ui@${m[1]}  (expected @${version})`);
      }
    }
  });
}

if (problems.length) {
  console.error(
    `✗ check:versions — ${problems.length} stale exact version literal(s) in shipped docs (package.json is ${version}):`,
  );
  for (const p of problems) console.error(`    ${p}`);
  console.error('  Update the literal(s) to match, or run the release bump that rewrites them.');
  process.exit(1);
}

log(
  `✓ check:versions — all @ponchia/ui@X.Y.Z[-prerelease] literals in shipped docs match ${version}`,
);
