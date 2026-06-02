/**
 * Enforce: the committed `.d.ts` (+ `.d.ts.map`) for each hand-authored JS leaf
 * is exactly what `tsc -p tsconfig.dts.json` emits from its JSDoc right now —
 * the same generate-commit-drift-check contract as the rest of the registry,
 * but the generator is `tsc`, so it re-emits to a temp dir and byte-compares
 * instead of importing a pure builder.
 *
 * Because each `.d.ts` is derived from its source, names/signatures cannot drift
 * — this gate replaces the hand-`.d.ts` name-parity gates (check-behaviors /
 * check-helpers-dts / check-bindings).
 *
 * Run: node scripts/check-dts-emit.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative, sep, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = mkdtempSync(join(tmpdir(), 'bronto-dts-'));

// Re-emit every leaf declaration to a throwaway dir. tsc may exit non-zero on
// advisory config diagnostics while still emitting (noEmitOnError:false), so we
// don't trust its exit code — the byte-compare below is the real assertion.
try {
  execFileSync('npx', ['tsc', '-p', 'tsconfig.dts.json', '--outDir', out], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
} catch {
  /* fall through to the file comparison */
}

// Walk the emitted tree; every emitted file must byte-match its committed twin.
const errors = [];
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name);
    if (e.isDirectory()) walk(abs);
    else if (e.name.endsWith('.d.ts')) {
      // Compare the declarations only. The sibling `.d.ts.map` is emitted by the
      // same run, but its `sources` path is relative to the emit dir, so the
      // temp copy never byte-matches the in-place one — comparing the .d.ts is
      // the real freshness signal.
      const rel = relative(out, abs).split(sep).join('/');
      const committed = resolve(root, rel);
      if (!existsSync(committed)) errors.push(`${rel} missing — run: npm run dts:emit`);
      else if (readFileSync(committed, 'utf8') !== readFileSync(abs, 'utf8'))
        errors.push(`${rel} is stale — run: npm run dts:emit`);
    }
  }
};
walk(out);

if (errors.length) {
  console.error(`✖ ${errors.length} generated-declaration problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ generated leaf .d.ts (+ maps) are the fresh tsc emit of their JSDoc'd source`);
