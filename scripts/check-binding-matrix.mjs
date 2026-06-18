// Gate: every optional framework binding stays aligned with the behavior
// barrel, docs, examples, unit ownership, and type ownership. The bindings are
// public package subpaths; a new behavior cannot quietly miss React/Solid/Qwik
// hooks, Svelte actions, Vue directives, docs, packed-example smoke ownership,
// or declaration-level consumer proof.
//
// Run: node scripts/check-binding-matrix.mjs
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { reportAndExit } from './lib/gate-report.mjs';
import { createTextReader, hasWord, relExists } from './lib/ownership-proof.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const text = createTextReader(root);

function fileExists(rel) {
  return relExists(root, rel);
}

function lowerFirst(value) {
  return `${value[0].toLowerCase()}${value.slice(1)}`;
}

function lifecycleNames(barrel) {
  return Object.keys(barrel)
    .filter((name) => /^init[A-Z]/.test(name) || name === 'dismissible')
    .map((name) => (name === 'dismissible' ? 'Dismissible' : name.slice(4)))
    .sort((a, b) => a.localeCompare(b));
}

function requireFile(rel, owner) {
  if (!fileExists(rel)) {
    errors.push(`${owner} is missing ${rel}`);
    return false;
  }
  return true;
}

function requireText(rel, needles, owner) {
  if (!requireFile(rel, owner)) return;
  const body = text(rel);
  for (const needle of needles) {
    if (!body.includes(needle)) errors.push(`${owner}: ${rel} does not contain "${needle}"`);
  }
}

function requireWords(rel, names, owner) {
  if (!requireFile(rel, owner)) return;
  const body = text(rel);
  for (const name of names) {
    if (!hasWord(body, name)) errors.push(`${owner}: ${rel} does not mention ${name}`);
  }
}

async function publicModule(rel) {
  return import(pathToFileURL(resolve(root, rel)));
}

const barrel = await publicModule('behaviors/index.js');
const names = lifecycleNames(barrel);
const expectedHooks = names.map((name) => `use${name}`);
const expectedActions = names.map(lowerFirst);
const expectedDirectives = names.map((name) => `v${name}`);

const hookBindings = [
  {
    name: 'react',
    source: 'react/index.js',
    docs: 'docs/getting-started/react-solid.md',
    example: 'examples/react-vite/src/main.jsx',
    importSpecifier: '@ponchia/ui/react',
    exampleNeedles: ['useThemeToggle', 'useDialog', 'useTabs', 'useDotGlyph', 'useToast'],
  },
  {
    name: 'solid',
    source: 'solid/index.js',
    docs: 'docs/getting-started/react-solid.md',
    example: 'examples/solid-vite/src/main.jsx',
    importSpecifier: '@ponchia/ui/solid',
    exampleNeedles: ['useThemeToggle', 'useDialog', 'useTabs', 'useDotGlyph', 'useToast'],
  },
  {
    name: 'qwik',
    source: 'qwik/index.js',
    docs: 'docs/getting-started/react-solid.md',
    example: 'examples/qwik-vite/src/main.jsx',
    importSpecifier: '@ponchia/ui/qwik',
    exampleNeedles: ['useThemeToggle', 'useDialog', 'useTabs', 'useDotGlyph', 'useToast'],
  },
  {
    name: 'svelte',
    source: 'svelte/index.js',
    docs: 'docs/getting-started/sveltekit.md',
    example: 'examples/sveltekit/src/routes/+page.svelte',
    importSpecifier: '@ponchia/ui/svelte',
    exampleNeedles: ['themeToggle', 'dialog', 'tabs', 'dotGlyph', 'toast'],
  },
];

const unitOwner = 'test/bindings.test.mjs';
const typeOwner = 'test/types.test-d.ts';
requireText(
  unitOwner,
  [
    'binding hook surface is identical across react/solid/qwik/svelte',
    'Vue directive surface covers every delegated behavior',
    'Svelte action resolves node roots',
  ],
  'binding unit ownership',
);
requireText(
  typeOwner,
  [
    'Framework bindings: the ./react + ./solid hook types resolve from the .d.ts',
    'Qwik bindings: same opts surface',
    'Svelte actions: action functions take an Element',
    'Vue directives: directive objects and registry entries are directly usable',
    'Vue plugin install requires a directive registrar',
  ],
  'binding type ownership',
);

for (const entry of hookBindings) {
  const mod = await publicModule(entry.source);
  const haveHooks = Object.keys(mod)
    .filter((key) => /^use[A-Z]/.test(key))
    .sort((a, b) => a.localeCompare(b));
  const expected = [...expectedHooks, 'useBrontoBehavior', 'useToast'].sort((a, b) =>
    a.localeCompare(b),
  );
  if (JSON.stringify(haveHooks) !== JSON.stringify(expected)) {
    errors.push(
      `${entry.name}: hook export surface mismatch; expected [${expected.join(
        ', ',
      )}], got [${haveHooks.join(', ')}]`,
    );
  }
  for (const convenience of ['applyStoredTheme', 'cls', 'ui', 'cx']) {
    if (!(convenience in mod))
      errors.push(`${entry.name}: missing ${convenience} convenience export`);
  }

  requireText(entry.docs, [entry.importSpecifier, 'useToast', 'useBrontoBehavior'], entry.name);
  requireText(
    entry.example,
    [
      entry.importSpecifier,
      'data-bindings-disable',
      'data-bindings-state',
      ...entry.exampleNeedles,
    ],
    `${entry.name} example binding smoke`,
  );
}
requireWords('docs/getting-started/react-solid.md', expectedHooks, 'react/solid/qwik docs');

const svelte = await publicModule('svelte/index.js');
for (const action of expectedActions) {
  if (!(action in svelte)) errors.push(`svelte: missing ${action} action export`);
  if (!(svelte[`use${action[0].toUpperCase()}${action.slice(1)}`] === svelte[action])) {
    errors.push(`svelte: use${action[0].toUpperCase()}${action.slice(1)} does not alias ${action}`);
  }
}
for (const name of ['createBrontoAction', 'brontoBehavior', 'useBrontoBehavior', 'toast']) {
  if (!(name in svelte)) errors.push(`svelte: missing ${name} export`);
}
requireWords('docs/getting-started/sveltekit.md', expectedActions, 'svelte docs');
requireText(
  'docs/getting-started/sveltekit.md',
  ['createBrontoAction', 'brontoBehavior', 'useBrontoBehavior', 'toast'],
  'svelte docs',
);

const vue = await publicModule('vue/index.js');
for (const directive of expectedDirectives) {
  if (!(directive in vue)) errors.push(`vue: missing ${directive} directive export`);
  const registryKey = lowerFirst(directive.slice(1));
  if (vue.directives?.[registryKey] !== vue[directive]) {
    errors.push(`vue: directives.${registryKey} does not point at ${directive}`);
  }
}
const actualVueDirectives = Object.keys(vue)
  .filter((key) => /^v[A-Z]/.test(key))
  .sort((a, b) => a.localeCompare(b));
if (JSON.stringify(actualVueDirectives) !== JSON.stringify(expectedDirectives)) {
  errors.push(
    `vue: v* directive surface mismatch; expected [${expectedDirectives.join(
      ', ',
    )}], got [${actualVueDirectives.join(', ')}]`,
  );
}
for (const name of ['brontoVue', 'default', 'useToast', 'toast']) {
  if (!(name in vue)) errors.push(`vue: missing ${name} export`);
}
requireWords('docs/getting-started/vue.md', expectedDirectives, 'vue docs');
requireText('docs/getting-started/vue.md', ['brontoVue', 'useToast', 'toast'], 'vue docs');

reportAndExit(errors, {
  label: 'binding matrix',
  ok:
    `${names.length} delegated behavior binding(s) have React/Solid/Qwik hooks, ` +
    `Svelte actions, Vue directives, docs, examples, unit ownership, and type ownership`,
});
