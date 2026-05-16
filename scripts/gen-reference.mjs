/**
 * Generate docs/reference.md — the browsable class + token reference —
 * straight from the machine-readable registries (classes/index.js `cls`
 * and tokens/index.js `cssVars`). No Storybook, no second toolchain:
 * same generate-commit-drift-check model as the .d.ts and tokens.json.
 *
 *   docs/reference.md ← classes/index.js + tokens/index.js
 *
 * Drift-checked by scripts/check-reference.mjs (wired into `npm run
 * check`), so the reference can never silently rot from the contract.
 *
 * Run: node scripts/gen-reference.mjs
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cls } from '../classes/index.js';
import { cssVars } from '../tokens/index.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Base = the class up to the first BEM separator (`--` modifier / `__`
// part). Everything sharing a base is one component group.
const baseOf = (v) => v.split('--')[0].split('__')[0];

const groups = new Map();
for (const [key, value] of Object.entries(cls)) {
  const base = baseOf(value);
  if (!groups.has(base)) groups.set(base, []);
  groups.get(base).push({ key, value });
}

const kind = (value) =>
  value.includes('--') ? 'modifier' : value.includes('__') ? 'part' : 'base';

const classSection = [...groups.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([base, entries]) => {
    const rows = entries
      .sort((x, y) => x.value.localeCompare(y.value))
      .map((e) => `| \`cls.${e.key}\` | \`${e.value}\` | ${kind(e.value)} |`)
      .join('\n');
    return `### \`.${base}\`\n\n| Registry key | Class | Kind |\n| --- | --- | --- |\n${rows}\n`;
  })
  .join('\n');

const tokenTable = (obj) =>
  '| Token | Value |\n| --- | --- |\n' +
  Object.entries(obj)
    .map(([k, v]) => `| \`${k}\` | \`${String(v).replace(/\|/g, '\\|')}\` |`)
    .join('\n');

const totalClasses = Object.keys(cls).length;

const md = `<!-- @ponchia/ui — GENERATED from classes/index.js + tokens/index.js
     by scripts/gen-reference.mjs. Do not edit by hand; run
     \`npm run reference:build\`. Drift-checked in CI. -->

# Reference

The complete public surface, generated from the typed contract. Live
rendering of every class is the kitchen-sink demo:
**<https://ponchia.github.io/bronto-ui/>**. Theming knobs and the token
contract: [docs/theming.md](theming.md).

- ${totalClasses} classes across ${groups.size} component groups
- Import the typed registry: \`import { cls, ui, cx } from '@ponchia/ui/classes'\`
- Tokens as data: \`import { cssVars, tokens, themeColor } from '@ponchia/ui/tokens'\`

## Classes

Grouped by base class. \`--x\` = modifier, \`__x\` = part. Every key is a
member of \`cls\` and a recipe-emittable string; \`check-classes\` proves
each one matches a real selector in the stylesheet.

${classSection}
## Tokens

Exact mirror of the \`:root\` blocks in \`css/tokens.css\`
(\`check-tokens\` enforces parity). DTCG export:
[\`@ponchia/ui/tokens.dtcg.json\`](../tokens/tokens.dtcg.json).

### Global (scales — shared by both themes)

${tokenTable(cssVars.global)}

### Light theme

${tokenTable(cssVars.light)}

### Dark theme

${tokenTable(cssVars.dark)}
`;

export const generated = { 'docs/reference.md': md };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const [rel, content] of Object.entries(generated)) {
    writeFileSync(resolve(root, rel), content);
    console.log(`✓ wrote ${rel} (${totalClasses} classes, ${groups.size} groups)`);
  }
}
