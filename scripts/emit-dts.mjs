/**
 * Emit the leaf declarations in place. Deletes the existing `<leaf>/index.d.ts`
 * (+ `.d.ts.map`) first: when one included leaf imports another (annotations →
 * connectors), tsc loads the committed `.d.ts` as a program input and then
 * refuses to overwrite it (TS5055). Removing them first makes the cross-leaf
 * import resolve to the `.js` (allowJs), so every leaf re-emits cleanly.
 *
 * Run: node scripts/emit-dts.mjs   (or: npm run dts:emit)
 */
import { readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(resolve(root, 'tsconfig.dts.json'), 'utf8'));

for (const inc of cfg.include) {
  const base = inc.replace(/\.js$/, '');
  rmSync(resolve(root, `${base}.d.ts`), { force: true });
  rmSync(resolve(root, `${base}.d.ts.map`), { force: true });
}

execFileSync('npx', ['tsc', '-p', 'tsconfig.dts.json'], { cwd: root, stdio: 'inherit' });
