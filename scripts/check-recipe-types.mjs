// Gate: the `*Opts` STRING-literal unions in classes/index.d.ts must match the
// string options each `ui.*()` factory actually branches on in classes/index.js.
//
// The factory (`tone === 'info' && cls.meterInfo`) is the runtime truth; the
// `.d.ts` union (`tone?: 'accent' | … `) is hand-mirrored in gen-dts.mjs with no
// cross-check — so a tone/variant/style added to the factory but not the union
// (or vice-versa) ships green: `check:classes` verifies method NAMES only, and
// `tsc` only checks the `.d.ts` is internally consistent, not that it matches the
// factory. A consumer then gets a spurious type-error for a value that renders a
// real class (this gate was added after exactly that drift: meter `info`,
// bracket-note `success`). Found by the code-quality audit (Q1).
//
// Scope, deliberately narrow: only STRING-literal option keys (tone, variant,
// style, motion, state, size, density, orient, type, shape, …). Numeric keys
// (`series === 1`) and booleans carry no string literal in either source, so
// they fall out naturally. Helper-backed maps (`badgeTone(tone)`,
// `srcTone(state)`, `stateTone(state)`, …) are read as runtime truth too.
//
// Run: node scripts/check-recipe-types.mjs
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const js = readFileSync(resolve(root, 'classes/index.js'), 'utf8');
const dts = readFileSync(resolve(root, 'classes/index.d.ts'), 'utf8');

// --- factory side: classes/index.js `const ui = { … }` -----------------------
const uiStart = js.indexOf('const ui = {');
const uiBody = uiStart >= 0 ? js.slice(uiStart) : js;

function matchingBraceEnd(source, open) {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const objectKeys = (body) =>
  [...body.matchAll(/(?:^|[,{])\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/gm)].map(
    (m) => m[1] ?? m[2] ?? m[3],
  );

// Helper maps are still runtime truth. They appear in two local shapes:
//   const srcTone = (state) => ({ verified: cls.x })[state] || '';
//   const badgeTone = (tone) => toneClass('badge', { accent: cls.x }, tone);
const helperMaps = {};
for (const m of js.matchAll(/const\s+(\w+)\s*=\s*\((\w+)\)\s*=>/g)) {
  const [helper, arg] = [m[1], m[2]];
  const objectStart = js.indexOf('{', m.index);
  if (objectStart < 0) continue;
  const objectEnd = matchingBraceEnd(js, objectStart);
  if (objectEnd < 0) continue;
  const prefix = js.slice(m.index, objectStart);
  const suffix = js.slice(objectEnd + 1, objectEnd + 120);
  const isToneClass = /=>\s*toneClass\(/s.test(prefix);
  const isLookup = new RegExp(`^\\s*\\)\\s*\\[\\s*${arg}\\s*\\]\\s*\\|\\|\\s*['"]{2}`).test(suffix);
  if (!isToneClass && !isLookup) continue;
  helperMaps[helper] = new Set(objectKeys(js.slice(objectStart + 1, objectEnd)));
}

// Split into per-method chunks. Methods are `  name: (` at two-space indent
// (prettier-enforced), so the next such header bounds each chunk.
const methodRe = /\n {2}([a-zA-Z]\w*): \(/g;
const heads = [...uiBody.matchAll(methodRe)];
/** method name -> { key -> Set(stringLiterals) } */
const factory = {};
heads.forEach((m, i) => {
  const name = m[1];
  const chunk = uiBody.slice(m.index, i + 1 < heads.length ? heads[i + 1].index : undefined);
  const keys = {};
  for (const lit of chunk.matchAll(/(\w+)\s*===\s*'([^']+)'/g)) {
    (keys[lit[1]] ??= new Set()).add(lit[2]);
  }
  for (const [helper, lits] of Object.entries(helperMaps)) {
    const callRe = new RegExp(`\\b${helper}\\(\\s*(\\w+)\\s*\\)`, 'g');
    for (const call of chunk.matchAll(callRe)) {
      const key = call[1];
      for (const lit of lits) (keys[key] ??= new Set()).add(lit);
    }
  }
  factory[name] = keys;
});

// --- type side: classes/index.d.ts type aliases + `*Opts` interfaces ---------
const aliasLiterals = (body) => [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
/** alias name -> Set(literals) for `export type X = 'a' | 'b' …;` */
const aliases = {};
for (const a of dts.matchAll(/export type (\w+) =\s*([^;]+);/g)) {
  aliases[a[1]] = new Set(aliasLiterals(a[2]));
}
/** OptsName -> { key -> Set(stringLiterals) } (aliases resolved) */
const optsTypes = {};
for (const iface of dts.matchAll(/export interface (\w+Opts) \{([\s\S]*?)\n\}/g)) {
  const keys = {};
  for (const prop of iface[2].matchAll(/(\w+)\?:\s*([^;]+);/g)) {
    const [, key, type] = prop;
    const lits = new Set(aliasLiterals(type));
    // resolve a referenced alias (e.g. `tone?: Tone;`)
    for (const ref of type.matchAll(/\b([A-Z]\w+)\b/g)) {
      if (aliases[ref[1]]) for (const v of aliases[ref[1]]) lits.add(v);
    }
    if (lits.size) keys[key] = lits;
  }
  optsTypes[iface[1]] = keys;
}

const optsNameFor = (method) => `${method[0].toUpperCase()}${method.slice(1)}Opts`;
const eqSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const show = (s) => `{${[...s].sort().join(', ')}}`;

const problems = [];
let checked = 0;
const skipped = [];

for (const [method, keys] of Object.entries(factory)) {
  for (const [key, lits] of Object.entries(keys)) {
    if (!lits.size) continue;
    const optsName = optsNameFor(method);
    const opts = optsTypes[optsName];
    if (!opts) {
      skipped.push(`${method}.${key} (no ${optsName} interface)`);
      continue;
    }
    const union = opts[key];
    if (!union) {
      // The factory branches on a string the type doesn't expose at all.
      problems.push(
        `${optsName}.${key} missing — factory branches on ${show(lits)} but the type has no such literal union`,
      );
      continue;
    }
    checked++;
    if (!eqSet(lits, union)) {
      const missingInType = new Set([...lits].filter((x) => !union.has(x)));
      const extraInType = new Set([...union].filter((x) => !lits.has(x)));
      problems.push(
        `${optsName}.${key} union ${show(union)} != factory ${show(lits)} ` +
          `(missing in type: ${show(missingInType)}; extra in type: ${show(extraInType)})`,
      );
    }
  }
}

if (problems.length) {
  console.error(`✗ check:recipe-types — ${problems.length} factory↔.d.ts option drift(s):`);
  for (const p of problems) console.error(`    ${p}`);
  console.error(
    '  Fix the `*Opts` union in scripts/gen-dts.mjs to match the factory branches\n' +
      '  / helper maps in classes/index.js (then `npm run dts:build`), or fix the factory.',
  );
  process.exit(1);
}

console.log(
  `✓ check:recipe-types — ${checked} factory/helper option set(s) match their .d.ts unions` +
    (skipped.length ? ` (${skipped.length} helper/typeless keys skipped)` : ''),
);
