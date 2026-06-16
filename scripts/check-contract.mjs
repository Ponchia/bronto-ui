// Gate: the doc/contract surfaces an LLM authors from must not silently lie.
//
// The artifact-drift gates (check:fresh / check:classes / check:dts-*) prove the
// generated tokens + class registry stay in sync, but NOTHING gated the prose +
// manifest an external system actually reads. The 0.6.0 component audit found
// exactly that blind spot: a `--icon-mask: var(--glyph-check)` recipe pointing at
// a token that never existed (C1, paints a solid square), a documented
// `initForms()` that is really `initFormValidation` (C15, ImportError), and the
// form/combobox wiring attributes absent from the machine-adjacent contract
// (C14). All three VALIDATE — the markup/recipe looks right — and silently
// no-op. This gate closes that whole class (component-audit C39):
//
//   (a) every classes.json `customProperties` example RESOLVES — each `var(--X)`
//       it references names a custom property actually defined in css/.
//   (b) the form-validation / combobox wiring attributes a behavior reads are
//       named in docs/reference.md (the language-neutral contract doc).
//   (c) every `init*()` named in a SHIPPED doc is a real export of
//       behaviors/index.js.
//
// Run: node scripts/check-contract.mjs
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildClassesJson } from './gen-classes-json.mjs';
import { stripCssComments } from './lib/patterns.mjs';
import { shippedDocs } from './lib/shipped-docs.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const errors = [];

// ---- (a) customProperties examples resolve ---------------------------------
// Collect every custom property DEFINED (assigned) anywhere in css/ — comments
// stripped, so a name living only in a comment doesn't count as defined.
const cssDir = resolve(root, 'css');
const definedProps = new Set();
const selectorClasses = new Set(); // every ui-* class that appears in a selector
for (const f of readdirSync(cssDir)) {
  if (!f.endsWith('.css')) continue;
  const src = stripCssComments(readFileSync(resolve(cssDir, f), 'utf8'));
  for (const m of src.matchAll(/(--[\w-]+)\s*:/g)) definedProps.add(m[1]);
  for (const m of src.matchAll(/\.(ui-[\w-]+)/g)) selectorClasses.add(m[1]);
}

const manifest = buildClassesJson();
for (const p of manifest.customProperties) {
  const example = String(p.example ?? '');
  if (!example.trim()) {
    errors.push(`(a) customProperties ${p.name}: example is empty — it must resolve to a value`);
    continue;
  }
  for (const m of example.matchAll(/var\(\s*(--[\w-]+)/g)) {
    if (!definedProps.has(m[1])) {
      errors.push(
        `(a) customProperties ${p.name}: example "${example}" references ${m[1]}, ` +
          `which is NOT a custom property defined in css/ → it resolves to nothing ` +
          `(this is the --icon-mask: var(--glyph-check) trap)`,
      );
    }
  }
}

// ---- (b) wiring attributes are in the contract doc -------------------------
// The audit-flagged set: the attributes/events an author MUST write for form
// validation + the combobox to work. They were only in behavior JSDoc, so an
// LLM authoring from classes.json/reference.md built a no-op form (C14).
const WIRING = [
  'data-bronto-validate',
  'data-bronto-error',
  'data-bronto-error-summary',
  'data-bronto-combobox',
  'bronto:change',
];
const reference = readFileSync(resolve(root, 'docs/reference.md'), 'utf8');
for (const attr of WIRING) {
  if (!reference.includes(attr)) {
    errors.push(`(b) wiring "${attr}" is read by a behavior but absent from docs/reference.md`);
  }
}

// ---- (c) documented init*() names are real exports -------------------------
// Parse the behavior barrel's export names.
const barrel = readFileSync(resolve(root, 'behaviors/index.js'), 'utf8');
const exported = new Set();
for (const m of barrel.matchAll(/export\s*\{([^}]+)\}/g)) {
  for (const name of m[1].split(',')) {
    const id = name
      .trim()
      .split(/\s+as\s+/)
      .pop()
      .trim();
    if (id) exported.add(id);
  }
}
for (const m of barrel.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) {
  exported.add(m[1]);
}

function dirDocs(dir) {
  const abs = resolve(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => `${dir}/${name}`);
}

// Docs an LLM/user is expected to author from: shipped tarball docs plus the
// GitHub-only docs index and getting-started pages that README links.
const contractDocs = [
  ...new Set([
    ...shippedDocs(pkg).filter((f) => f !== 'CHANGELOG.md'),
    'docs/README.md',
    'docs/integration.md',
    ...dirDocs('docs/getting-started'),
  ]),
];
const seen = new Map(); // initName -> "rel:line"
for (const rel of contractDocs) {
  let text;
  try {
    text = readFileSync(resolve(root, rel), 'utf8');
  } catch {
    continue;
  }
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\binit[A-Z][A-Za-z0-9]*/g)) {
      if (!seen.has(m[0])) seen.set(m[0], `${rel}:${i + 1}`);
    }
  });
}
for (const [name, where] of seen) {
  if (!exported.has(name)) {
    errors.push(
      `(c) ${where}: doc names "${name}()" but it is not exported from behaviors/index.js ` +
        `(initForms→initFormValidation class of drift)`,
    );
  }
}

// ---- (f) named imports in public docs resolve to real public exports --------
const namedImport =
  /import\s+(?:[\w$]+\s*,\s*)?\{([^}]+)\}\s+from\s+['"](@ponchia\/ui(?:\/[^'"]*)?)['"]/g;
const moduleCache = new Map();
async function publicModule(specifier) {
  if (!moduleCache.has(specifier)) {
    moduleCache.set(
      specifier,
      import(specifier).catch((error) => ({ __importError: error })),
    );
  }
  return moduleCache.get(specifier);
}

for (const rel of contractDocs) {
  let text;
  try {
    text = readFileSync(resolve(root, rel), 'utf8');
  } catch {
    continue;
  }
  for (const m of text.matchAll(namedImport)) {
    const names = m[1]
      .split(',')
      .map((name) =>
        name
          .trim()
          .split(/\s+as\s+/)[0]
          .trim(),
      )
      .filter(Boolean);
    const specifier = m[2];
    const mod = await publicModule(specifier);
    const line = text.slice(0, m.index).split('\n').length;
    if (mod.__importError) {
      errors.push(`(f) ${rel}:${line}: import from "${specifier}" fails: ${mod.__importError}`);
      continue;
    }
    for (const name of names) {
      if (!(name in mod)) {
        errors.push(
          `(f) ${rel}:${line}: imports { ${name} } from "${specifier}", but that name is not exported`,
        );
      }
    }
  }
}

// ---- (d) every non-null groups[].base resolves to a real CSS selector ------
// classes.json synthesises a `base` per namespace. A `base` with NO `.base { }`
// rule is a phantom that renders unstyled — the `ui-themetoggle` C11 trap, where
// classes.json advertised a base the CSS never defined. Gen now sets a parts-only
// namespace's base to null; this proves every NON-null base really has a selector.
for (const [name, g] of Object.entries(manifest.groups)) {
  if (g.base && !selectorClasses.has(g.base)) {
    errors.push(
      `(d) groups["${name}"].base "${g.base}" is declared but has no .${g.base} ` +
        `selector in css/ — a phantom base renders unstyled. Set it null if this ` +
        `is a parts-only namespace, or add the missing CSS rule.`,
    );
  }
}

// ---- (e) behaviorAttributes manifest is COMPLETE ---------------------------
// (b) only checks a hand-picked WIRING subset appears as prose in reference.md.
// That let the manifest itself drift: classes.json shipped 9 of ~34 consumed
// data-bronto-* hooks, so an LLM reading the structured contract was blind to
// tabs / theme-toggle / sortable / combobox-live / carousel / glyph / … (C2).
// Derive the expected set from the behaviors source — the runtime truth — and
// fail on any hook a behavior READS but the manifest omits (or lists but no
// behavior reads). This is the structural fix that keeps C2 from recurring (C11).
const behDir = resolve(root, 'behaviors');
const consumed = new Set();
for (const f of readdirSync(behDir)) {
  if (!f.endsWith('.js') || f.endsWith('.d.ts')) continue;
  const src = readFileSync(resolve(behDir, f), 'utf8');
  for (const m of src.matchAll(/data-bronto-[a-z-]+/g)) consumed.add(m[0]);
}
const manifested = new Set(manifest.behaviorAttributes.map((a) => a.name));
for (const attr of [...consumed].sort()) {
  if (!manifested.has(attr)) {
    errors.push(
      `(e) "${attr}" is read by a behavior but MISSING from classes.json behaviorAttributes — ` +
        `an LLM authoring from the structured contract can't wire it. Add an entry in ` +
        `gen-classes-json.mjs (name/on/behavior/note).`,
    );
  }
}
for (const attr of [...manifested].sort()) {
  if (!consumed.has(attr)) {
    errors.push(
      `(e) behaviorAttributes lists "${attr}" but NO behavior reads it — stale manifest entry; ` +
        `remove it or fix the name.`,
    );
  }
}

// ---- report ----------------------------------------------------------------
if (errors.length) {
  console.error(`✗ check:contract — ${errors.length} doc/contract surface(s) silently lie:`);
  for (const e of errors) console.error(`    ${e}`);
  console.error(
    '  These surfaces validate but no-op for an LLM authoring from the contract.\n' +
      '  Fix the recipe/doc/export, not the gate.',
  );
  process.exit(1);
}

const basesChecked = Object.values(manifest.groups).filter((g) => g.base).length;
log(
  `✓ check:contract — ${manifest.customProperties.length} customProperties examples resolve, ` +
    `${WIRING.length} wiring attrs in reference.md, ${seen.size} documented init*() all exported, ` +
    `${basesChecked} group bases resolve to a CSS selector, ` +
    `${manifest.behaviorAttributes.length} behaviorAttributes cover all ${consumed.size} consumed data-bronto-* hooks, ` +
    `and public named imports resolve`,
);
