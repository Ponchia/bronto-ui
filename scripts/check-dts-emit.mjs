/**
 * Enforce: the committed `.d.ts` (+ `.d.ts.map`) for each hand-authored JS leaf
 * is exactly what `tsc -p tsconfig.dts.json` emits from its JSDoc right now —
 * the same generate-commit-drift-check contract as the rest of the registry,
 * but the generator is `tsc`, so it re-emits to a temp dir and byte-compares
 * instead of importing a pure builder.
 *
 * Because each `.d.ts` is derived from its source, names/signatures cannot drift
 * — this gate replaces the name-parity gates for the migrated leaves
 * (check-helpers-dts for annotations/connectors, check-bindings for
 * react/solid/qwik/svelte/vue, and check-behaviors for the behaviors barrel —
 * all now emitted from JSDoc, so every leaf `.d.ts` is generated, none
 * hand-written).
 *
 * Run: node scripts/check-dts-emit.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative, sep, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { reportAndExit } from './lib/gate-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = mkdtempSync(join(tmpdir(), 'bronto-dts-'));
const tsconfig = JSON.parse(readFileSync(resolve(root, 'tsconfig.dts.json'), 'utf8'));
const expected = (tsconfig.include ?? [])
  .filter((rel) => rel.endsWith('.js'))
  .flatMap((rel) => {
    const base = rel.replace(/\.js$/, '.d.ts');
    return [base, `${base}.map`];
  });
const expectedSet = new Set(expected);
const seen = new Set();
const errors = [];

if (!expected.length) {
  errors.push('tsconfig.dts.json include produced no expected declaration outputs');
}

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

// Walk the emitted tree; every emitted expected file must byte-match its
// committed twin. Extra .d.ts files are reported: they usually mean the
// tsconfig include list or shipped declaration set drifted.
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name);
    if (e.isDirectory()) walk(abs);
    else if (e.name.endsWith('.d.ts.map')) {
      // Compare the declaration MAP too, normalizing the one volatile field:
      // `sources` is relative to the emit dir, so the temp copy never byte-
      // matches in place. Normalizing both to source basenames lets us still
      // gate the mapping data (`version`/`file`/`names`/`mappings`) against
      // drift — closing the hole where shipped map content could rot unchecked.
      const rel = relative(out, abs).split(sep).join('/');
      seen.add(rel);
      const committed = resolve(root, rel);
      if (!expectedSet.has(rel))
        errors.push(`${rel} emitted but is not expected by tsconfig.dts.json`);
      if (!existsSync(committed)) errors.push(`${rel} missing — run: npm run dts:emit`);
      else {
        const norm = (json) => {
          const o = JSON.parse(json);
          o.sources = (o.sources || []).map((s) => s.split('/').pop());
          return JSON.stringify(o);
        };
        if (norm(readFileSync(committed, 'utf8')) !== norm(readFileSync(abs, 'utf8')))
          errors.push(`${rel} mappings are stale — run: npm run dts:emit`);
      }
    } else if (e.name.endsWith('.d.ts')) {
      // The declaration surface byte-matches in place (no volatile paths).
      const rel = relative(out, abs).split(sep).join('/');
      seen.add(rel);
      const committed = resolve(root, rel);
      if (!expectedSet.has(rel))
        errors.push(`${rel} emitted but is not expected by tsconfig.dts.json`);
      if (!existsSync(committed)) errors.push(`${rel} missing — run: npm run dts:emit`);
      else if (readFileSync(committed, 'utf8') !== readFileSync(abs, 'utf8'))
        errors.push(`${rel} is stale — run: npm run dts:emit`);
    }
  }
};
walk(out);

for (const rel of expected) {
  if (!seen.has(rel)) errors.push(`${rel} was not emitted by tsc — check tsconfig.dts.json`);
}

reportAndExit(errors, {
  label: 'generated-declaration',
  ok: `generated leaf .d.ts (+ maps) are the fresh tsc emit of their JSDoc'd source`,
});
