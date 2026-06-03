// Meta-gate: every `check:*` script must be wired into the aggregate `check`
// chain (and the chain must not name a check that doesn't exist). The chain is a
// hand-maintained `&&` list, so a newly-added gate silently never runs until
// someone remembers to append it — the exact silent-coverage-drop this repo has
// been bitten by. This closes it structurally. (code-quality audit Q4.)
//
// Run: node scripts/check-chain.mjs
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const scripts = pkg.scripts ?? {};

const chain = scripts.check ?? '';
// `check:*` gates that must be in the chain — excluding the chain itself and
// this meta-gate (which the chain runs, but which would otherwise demand to
// contain itself).
const SELF = new Set(['check', 'check:chain']);
const gates = Object.keys(scripts).filter((k) => k.startsWith('check:') && !SELF.has(k));

// A reference is `npm run <key>` not immediately followed by a name char, so
// `check:dts` would not match inside `check:dts-emit`. String scan (no regex
// built from `key`) — avoids any escaping pitfalls around the `:` in the key.
const BOUNDARY = /[\w:-]/;
const referenced = (key) => {
  const needle = `npm run ${key}`;
  for (let i = chain.indexOf(needle); i !== -1; i = chain.indexOf(needle, i + 1)) {
    const after = chain[i + needle.length];
    if (after === undefined || !BOUNDARY.test(after)) return true;
  }
  return false;
};

const problems = [];
for (const key of gates) {
  if (!referenced(key))
    problems.push(`"${key}" is defined but NOT in the \`check\` chain — it never runs`);
}
// Inverse: the chain must not reference a removed/renamed gate.
for (const ref of chain.matchAll(/npm run (check:[\w:-]+)/g)) {
  if (!scripts[ref[1]]) problems.push(`\`check\` chain runs "${ref[1]}" but no such script exists`);
}

if (problems.length) {
  console.error(`✗ check:chain — ${problems.length} aggregate-chain coverage problem(s):`);
  for (const p of problems) console.error(`    ${p}`);
  console.error(
    '  Add the gate to the `check` script in package.json (or remove the stale reference).',
  );
  process.exit(1);
}

console.log(
  `✓ check:chain — all ${gates.length} check:* gates are wired into the aggregate \`check\` chain`,
);
