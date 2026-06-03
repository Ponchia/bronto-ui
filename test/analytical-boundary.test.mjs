import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// The analytical/report primitives "own their grammar + geometry but REFUSE to
// own scales, state, data-fetching, routing, or global key ownership" (docs/
// architecture.md, ADR-0001). That contract was previously enforced only by
// prose + reviewer reading; these import-scan guardrails make it executable so a
// future change that pulls a charting/scale dependency or persists state fails
// loudly instead of silently eroding the boundary.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

const ANALYTICAL_JS = [
  'behaviors/legend.js',
  'behaviors/connectors.js',
  'behaviors/crosshair.js',
  'behaviors/spotlight.js',
  'behaviors/command.js',
];

test('analytical behaviors stay dependency-free (only relative imports)', () => {
  for (const f of ANALYTICAL_JS) {
    for (const m of read(f).matchAll(/^\s*import\b[^;]*?from\s+['"]([^'"]+)['"]/gm)) {
      assert.ok(m[1].startsWith('.'), `${f}: only relative imports allowed, found "${m[1]}"`);
    }
  }
});

test('analytical behaviors own no scales, data-fetching, persistence, or routing', () => {
  const forbidden = [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bhistory\.(pushState|replaceState)\b/,
    /\bscaleLinear\b/,
    /\bscaleBand\b/,
    /\bd3\b/,
  ];
  for (const f of ANALYTICAL_JS) {
    const src = read(f);
    for (const re of forbidden) {
      assert.ok(!re.test(src), `${f} must not use ${re} (scales/state are the host's job)`);
    }
  }
});

test('command palette claims no global Cmd/Ctrl+K by default', () => {
  // The palette wires only its own listbox; opening it (and any global hotkey)
  // is explicitly the host's responsibility — so it must not inspect modifier
  // keys to grab a document-level shortcut.
  const src = read('behaviors/command.js');
  assert.ok(
    !/\bmetaKey\b/.test(src) && !/\bctrlKey\b/.test(src),
    'command.js owns no modifier-key shortcut',
  );
});
