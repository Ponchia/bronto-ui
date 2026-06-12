/**
 * Generate classes/vscode.css-custom-data.json — a VS Code CSS Custom
 * Data file so consumers get IntelliSense for every @ponchia/ui design
 * token inside `var(--…)`. The primary authoring surface of a CSS-first
 * framework is its custom properties; this makes them discoverable in
 * the editor without memorising the token list.
 *
 *   classes/vscode.css-custom-data.json ← tokens/index.js (cssVars)
 *
 * Same generate-commit-drift-check model as the .d.ts; checked by
 * scripts/check-fresh.mjs via the registry (wired into `npm run check`).
 *
 * Wiring (consumer .vscode/settings.json):
 *   { "css.customData": ["node_modules/@ponchia/ui/classes/vscode.css-custom-data.json"] }
 *
 * Run: node scripts/gen-vscode-data.mjs
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cssVars } from '../tokens/index.js';

import { repoRoot as root, isMain } from './lib/emit.mjs';
import { log } from './lib/stdio.mjs';

// Token name → human description. Tokens defined per-theme show both
// values so the hover explains the light/dark split.
const light = cssVars.light;
const dark = cssVars.dark;
const seen = new Map();

for (const [name, value] of Object.entries(cssVars.global)) {
  seen.set(name, `Global scale token. Value: \`${value}\``);
}
for (const name of new Set([...Object.keys(light), ...Object.keys(dark)])) {
  const l = light[name];
  const d = dark[name];
  const desc =
    l != null && d != null
      ? `Theme token. Light: \`${l}\` · Dark: \`${d}\``
      : `Theme token. Value: \`${l ?? d}\``;
  seen.set(name, desc);
}

const properties = [...seen.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, description]) => ({ name, description }));

const data = {
  version: 1.1,
  properties,
  atDirectives: [
    {
      name: '@layer bronto',
      description:
        'The single cascade layer @ponchia/ui ships in. Un-layered app CSS overrides it without specificity conflict.',
    },
  ],
};

// Two-space JSON + trailing newline; this exact byte layout is the
// drift-check contract (file is .prettierignore'd).
const json = JSON.stringify(data, null, 2) + '\n';

export const generated = { 'classes/vscode.css-custom-data.json': json };

if (isMain(import.meta.url)) {
  for (const [rel, content] of Object.entries(generated)) {
    writeFileSync(resolve(root, rel), content);
    log(`✓ wrote ${rel} (${properties.length} custom properties)`);
  }
}
