/**
 * Generate docs/reference.md — the browsable class + token reference —
 * straight from the machine-readable registries (classes/index.js `cls`
 * and tokens/index.js `cssVars`). No Storybook, no second toolchain:
 * same generate-commit-drift-check model as the .d.ts and tokens.json.
 *
 *   docs/reference.md ← classes/index.js + tokens/index.js
 *
 * Drift-checked by scripts/check-fresh.mjs via the registry (wired into
 * `npm run check`), so the reference can never silently rot from the contract.
 *
 * Run: node scripts/gen-reference.mjs
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cls } from '../classes/index.js';
import { cssVars } from '../tokens/index.js';

import { repoRoot as root, isMain } from './lib/emit.mjs';

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
    // Escape `\` before `|` so the sanitisation is complete (the escape
    // char must itself be escaped first) — satisfies the closed token
    // registry today and stays correct if a value ever contains either.
    .map(
      ([k, v]) => `| \`${k}\` | \`${String(v).replaceAll('\\', '\\\\').replaceAll('|', '\\|')}\` |`,
    )
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
- Validate markup as data (no JS/TS): \`@ponchia/ui/classes.json\` — the same
  vocabulary as language-neutral JSON (\`groups\`, \`classes\`, \`states\`,
  \`customProperties\`), for an external linter or non-JS host
- Tokens as data: \`import { cssVars, tokens, themeColor } from '@ponchia/ui/tokens'\`

## Classes

Grouped by base class. \`--x\` = modifier, \`__x\` = part. Every key is a
member of \`cls\` and a recipe-emittable string; \`check-classes\` proves
each one matches a real selector in the stylesheet.

${classSection}
## Table-local state classes

Not in \`cls\` by design — these are plain \`is-*\` state hooks scoped to
\`.ui-table\` (the same convention as \`is-active\` on tabs), so they never
collide with global classes. Apply them on \`<td>\`/\`<th>\`. A typed
registry consumer should reach for these instead of re-implementing
\`text-align\` / tabular figures by hand.

| Class | Where | Effect |
| --- | --- | --- |
| \`.ui-table .is-num\` | numeric \`<td>\`/\`<th>\` | tabular figures + end-aligned (the canonical numeric cell) |
| \`.ui-table .is-pos\` | numeric \`<td>\`, \`.ui-stat__delta\` | positive-delta tone |
| \`.ui-table .is-neg\` | numeric \`<td>\`, \`.ui-stat__delta\` | negative-delta tone |
| \`.ui-table .is-key\` | \`<td>\`/\`<th>\` | emphasised key column |

For numeric text *outside* a table, use the \`ui-num\` primitive
(\`ui.num({ tone })\`), which carries the same tabular/aligned/tone intent; for
a trend figure use \`ui-delta\` (\`ui.delta({ dir, invert })\`). The full,
machine-readable list of these \`is-*\` state hooks — and the author-set inline
custom properties (\`--chart-color\`, \`--chart-pattern\`, \`--value\`, and the
**required** \`--icon-mask\` on \`.ui-icon\` and \`--ui-vt-name\` on \`.ui-vt\` —
without which those classes render a solid square / do nothing) — is in
[\`@ponchia/ui/classes.json\`](../classes/classes.json)
(\`states\` / \`customProperties\`).

## Composition & state (read before re-implementing glue)

The agnostic surface is class- and string-recipe-only; **stateful and
relational wiring is ARIA-driven, not class-driven** — by design, so it
works in any framework without a binding layer:

- **Form field** — compose \`ui-field\` > \`ui-label\` + control +
  \`ui-hint\`. Invalid state is the native \`aria-invalid="true"\` on the
  control (styles \`ui-input\`/\`ui-select\`/\`ui-textarea\` red); associate
  the hint with \`aria-describedby\`. There is deliberately no
  \`ui-field--invalid\` class.
- **Button loading** — set \`aria-busy="true"\` (and \`disabled\`) on
  \`ui-button\`; the leading spinner is injected by CSS with no extra
  markup or class. \`ui-button--sm\`/\`--lg\` size it.
- **Badge tone** — \`ui.badge({ tone })\` emits the badge tone
  (\`accent|success|warning|danger|info|muted\`). The set is badge-specific, not a
  universal vocabulary — \`muted\` is a badge/neutral tone, absent from the status
  families (\`ui-alert\`/\`ui-toast\`/\`ui-meter\`/\`ui-dot\`); the builders warn on an
  out-of-set tone (see usage.md). Mapping an app's own variant
  vocabulary onto a tone is application logic, not a framework class.
- **Modal** — native \`<dialog>\` gets backdrop + top-layer + focus-trap
  free. For a controlled/portal modal, add \`is-open\`
  (\`ui.modal({ open: true })\`) for the same skin/layout; the
  backdrop, top-layer stacking AND focus-trap are then yours (\`.is-open\`
  is a bare grid — it does not float or stack on its own).
- **Current page** — mark the active link with \`aria-current="page"\`; it is
  the programmatic cue the navs honour (\`ui-sitenav\`, \`ui-app-nav\`). The
  \`.is-active\` class is the visual-only equivalent on \`ui-app-nav\`/\`ui-tab\`;
  prefer \`aria-current\` so assistive tech announces the current page.
- **Form validation wiring** — \`initFormValidation\` (\`@ponchia/ui/behaviors\`)
  reads these attributes; they ARE the contract, not styling. Markup that omits
  them renders but the behavior silently no-ops: \`data-bronto-validate\` on the
  \`<form>\`; an optional empty \`[data-bronto-error]\` node per field (it falls
  back to the field's \`.ui-hint\`, restoring the help text when valid again); a
  \`[data-bronto-error-summary]\` (\`.ui-error-summary\`) block. The combobox
  reads \`[data-bronto-combobox]\` + per-option \`data-value\` and emits
  \`bronto:change\` (\`{ detail: { value, label } }\`) on selection — \`label\` is the
  chosen option's text, so a live region can announce it without re-reading the DOM;
  the interactive
  legend emits \`bronto:legend:toggle\` (\`{ detail: { series, active } }\`).
- **Status indicator** — \`ui-status\` carries no dot of its own: compose it with
  a \`.ui-dot\` child + a text label, e.g.
  \`<span class="ui-status"><span class="ui-dot ui-dot--success"></span> Live</span>\`.
  (\`ui-state\` instead bakes in its own dot + the full tone vocabulary — pick
  one.) A semantic \`ui-dot--success|warning|danger|info\` is colour-only outside
  forced-colors, so it ALWAYS needs an adjacent text/aria label — never ship a
  bare coloured dot as the sole signal.
- **Opt-in component CSS** — a few classes are not in the core bundle and need
  their leaf imported, or they render unstyled: \`ui-property\`/\`ui-readout\` →
  \`@ponchia/ui/css/workbench.css\`; \`ui-mark\`/\`ui-bracket-note\` →
  \`@ponchia/ui/css/marks.css\`; the analytical leaves (\`ui-annotation\`,
  \`ui-crosshair\`, \`ui-spotlight\`, …) → their matching leaf.
- **Loaders need their children** — \`ui-dotspinner\` requires exactly eight
  \`<i>\` children, \`ui-dotloader\` three \`<span>\`, and a static \`ui-dotbar\`
  lights a segment with \`<i class="is-on">\`. A childless
  \`<span class="ui-dotspinner">\` renders nothing.
- **\`ui-caret\` is a typing cursor**, not a dropdown chevron — a blinking block
  caret. It is **pure CSS** (a \`uiBlink\` keyframe on \`::after\`); it needs no
  behavior — do NOT call \`initDotGlyph\` to animate it — and it is decorative, so
  keep it out of the a11y tree (\`aria-hidden\`). For a disclosure/affordance arrow
  use \`ui-link--arrow\` (\`ui.link({ arrow: true })\`).

## Tokens

Exact mirror of the \`:root\` blocks in \`css/tokens.css\`
(\`check-fresh\` enforces parity). DTCG export:
[\`@ponchia/ui/tokens.dtcg.json\`](../tokens/tokens.dtcg.json).

### Global (scales — shared by both themes)

${tokenTable(cssVars.global)}

### Light theme

${tokenTable(cssVars.light)}

### Dark theme

${tokenTable(cssVars.dark)}
`;

export const generated = { 'docs/reference.md': md };

if (isMain(import.meta.url)) {
  for (const [rel, content] of Object.entries(generated)) {
    writeFileSync(resolve(root, rel), content);
    console.log(`✓ wrote ${rel} (${totalClasses} classes, ${groups.size} groups)`);
  }
}
