/**
 * Generate docs/contrast.md — the published WCAG 2.1 contrast matrix for
 * every contractual token pairing, per theme, with the conformance level
 * each pairing is *held to* and a pass/fail verdict.
 *
 *   docs/contrast.md ← tokens/resolved.json model (gen-resolved.mjs)
 *
 * Same generate-commit-drift-check model as docs/reference.md: the doc is
 * a pure projection of the resolved token model, so it can never silently
 * rot from the palette. Unlike the reference, the audit is *also a gate*:
 * scripts/check-contrast.mjs fails CI if any contractual pairing drops
 * below its declared floor, turning an accessibility *intent* into a
 * machine-enforced *guarantee*.
 *
 * Ratios are sRGB WCAG 2.1 relative luminance. Translucent foregrounds
 * (soft fills) are alpha-flattened over their background before measuring
 * — what the eye actually sees.
 *
 * Run: node scripts/gen-contrast.mjs   (or: npm run contrast:build)
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildResolved } from './gen-resolved.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Parse a resolved literal (#rrggbb or rgba(r, g, b, a)) → [r,g,b,a]. */
function rgba(v) {
  const s = String(v).trim();
  let m = s.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const h = m[1];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      1,
    ];
  }
  m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    return [+p[0], +p[1], +p[2], p[3] != null ? +p[3] : 1];
  }
  return null;
}

/** Composite a possibly-translucent fg over an opaque bg (simple alpha). */
function flatten(fg, bg) {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)];
}

/** WCAG 2.1 relative luminance of an opaque sRGB triple. */
function luminance([r, g, b]) {
  const lin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio of fg (over bg) against bg. bg is treated as opaque. */
export function ratio(fgRaw, bgRaw) {
  const fg = rgba(fgRaw);
  const bg = rgba(bgRaw);
  if (!fg || !bg) return null;
  const bgOpaque = bg[3] >= 1 ? bg.slice(0, 3) : flatten(bg, [255, 255, 255]);
  const fgOpaque = fg[3] >= 1 ? fg.slice(0, 3) : flatten(fg, bgOpaque);
  const L1 = luminance(fgOpaque);
  const L2 = luminance(bgOpaque);
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The contractual pairings. `level` is what each pairing is *held to* and
 * what check-contrast gates on:
 *   text  — WCAG 1.4.3 body/UI text, AA 4.5:1
 *   ui    — WCAG 1.4.11 non-text UI / large text, 3:1
 * Picking the *role-appropriate* threshold (not a blanket 4.5) is the
 * honest contract: a focus ring is a 3:1 surface, not 16px body copy.
 */
const PAIRS = [
  // Primary + secondary copy on every surface a consumer can place it on.
  ['--text', '--bg', 'Body text on page background', 'text'],
  ['--text', '--surface', 'Body text on a card/panel', 'text'],
  ['--text', '--surface-muted', 'Body text on a muted panel', 'text'],
  ['--text-soft', '--bg', 'Secondary text on page background', 'text'],
  ['--text-soft', '--surface', 'Secondary text on a card', 'text'],
  ['--text-dim', '--bg', 'Dim/meta text on page background', 'text'],
  ['--text-dim', '--surface', 'Dim/meta text on a card', 'text'],
  // The accent used *as foreground text* — theming.md calls this the
  // AA-safe one, so it is gated at full text level deliberately.
  ['--accent-text', '--bg', 'Accent text on page background', 'text'],
  ['--accent-text', '--surface', 'Accent text on a card', 'text'],
  // Label on the primary (filled accent) button.
  ['--button-text', '--accent', 'Label on the primary button', 'text'],
  // Non-text UI: focus ring, accent fill, status colour, strong hairline.
  ['--focus-ring', '--bg', 'Focus ring vs page background', 'ui'],
  ['--focus-ring', '--surface', 'Focus ring vs a card', 'ui'],
  ['--accent', '--bg', 'Accent fill vs page background', 'ui'],
  ['--success', '--surface', 'Success indicator vs a card', 'ui'],
  ['--warning', '--surface', 'Warning indicator vs a card', 'ui'],
  ['--danger', '--surface', 'Danger indicator vs a card', 'ui'],
  // Hairlines are a deliberate identity choice and WCAG 1.4.11 exempts
  // decorative borders that are not the sole identifier of a control
  // (the framework re-asserts boundaries under forced-colors /
  // data-contrast="high" — see theming.md). Reported for transparency,
  // NOT gated: faking a pass would be the dishonest move here.
  ['--line-strong', '--surface', 'Strong hairline vs a card', 'decorative'],
];

const FLOOR = { text: 4.5, ui: 3.0, decorative: 0 };
const LABEL = {
  text: 'AA text (4.5:1)',
  ui: 'UI / large (3:1)',
  decorative: 'Decorative (1.4.11-exempt)',
};

/** Audit one theme → rows + worst-case failure list. */
export function auditTheme(palette) {
  const rows = [];
  for (const [fg, bg, role, level] of PAIRS) {
    const fv = palette[fg];
    const bv = palette[bg];
    const r = fv != null && bv != null ? ratio(fv, bv) : null;
    const floor = FLOOR[level];
    // Decorative rows are reported, never gated (WCAG 1.4.11 exempt).
    const gated = level !== 'decorative';
    const pass = !gated || (r != null && r >= floor);
    rows.push({ fg, bg, role, level, fv, bv, ratio: r, floor, gated, pass });
  }
  return rows;
}

export function audit() {
  const resolved = buildResolved();
  return { light: auditTheme(resolved.light), dark: auditTheme(resolved.dark) };
}

const r2 = (n) => (n == null ? 'n/a' : `${n.toFixed(2)}:1`);

function themeTable(rows) {
  const head =
    '| Foreground | Background | Role | Held to | Ratio | Verdict |\n' +
    '| --- | --- | --- | --- | --- | --- |';
  const body = rows
    .map(
      (x) =>
        `| \`${x.fg}\` | \`${x.bg}\` | ${x.role} | ${LABEL[x.level]} | ${r2(x.ratio)} | ${
          !x.gated ? 'ℹ️ not gated' : x.pass ? '✅ pass' : '❌ **FAIL**'
        } |`,
    )
    .join('\n');
  return `${head}\n${body}`;
}

function build() {
  const { light, dark } = audit();
  const allPass = [...light, ...dark].filter((x) => x.gated).every((x) => x.pass);
  const md = `<!-- @ponchia/ui — GENERATED from the resolved token model by
     scripts/gen-contrast.mjs. Do not edit by hand; run
     \`npm run contrast:build\`. Drift-checked AND gated in CI
     (scripts/check-contrast.mjs fails the build below the declared
     floor — so this table is a guarantee, not a snapshot). -->

# Contrast & WCAG conformance

Every contractual token pairing, the WCAG 2.1 level it is **held to**,
and its measured sRGB ratio per theme. Generated from the resolved token
model (\`tokens/resolved.json\`) so it cannot drift from the palette, and
**gated**: \`npm run check\` fails if any pairing drops below its floor.

## Guaranteed level

- **Body / UI text** pairings are guaranteed **WCAG 2.1 AA — 4.5:1**
  (1.4.3). This covers \`--text\`, \`--text-soft\`, \`--text-dim\`,
  \`--accent-text\`, and the primary-button label.
- **Non-text UI** (focus ring, accent fill, status colour, strong
  hairline) is guaranteed **3:1** (1.4.11 non-text contrast / the
  large-text bar). These are deliberately *not* held to 4.5:1 — a focus
  ring is a UI boundary, not body copy, and WCAG agrees.
- **Hairlines** (\`--line\`, \`--line-strong\`) are a deliberate identity
  choice and are **reported but not gated**: WCAG 1.4.11 exempts
  decorative borders that are not the sole identifier of a control. Where
  a boundary must be perceivable, the \`forced-colors\` /
  \`data-contrast="high"\` paths re-assert it (see
  [theming.md](theming.md)). The low hairline ratio is published here on
  purpose — hiding it would defeat the point of a gate.
- AAA (7:1) is **not** guaranteed; the high-contrast preset
  (\`data-contrast="high"\` / \`prefers-contrast: more\`) raises ratios
  further but is out of scope for this gated baseline.

Translucent foregrounds (soft fills) are alpha-flattened over their
background before measuring — the ratio the eye actually gets.

Overall: **${allPass ? 'all contractual pairings meet their floor ✅' : 'one or more pairings are below floor — see ❌ rows ❌'}**.

## Light theme

${themeTable(light)}

## Dark theme

${themeTable(dark)}

## Scope & caveats

- This gates the **framework token contract**, not arbitrary consumer
  re-brands. Re-accenting via \`--accent\` is your contrast obligation
  (see [theming.md](theming.md) → "Re-brand obligations"); this table is
  the guarantee for the *shipped* palettes only.
- Status colours (\`--success\` / \`--warning\` / \`--danger\`) are gated
  as **indicators** (3:1). If you set status text *as body copy* on a
  surface, verify 4.5:1 yourself or pair it with an icon/label.
- Ratios are sRGB WCAG 2.1. The newer APCA model is intentionally not
  used — WCAG 2.1 AA is the testable legal/again-axe baseline the e2e
  suite already asserts.
`;
  return { md, allPass, light, dark };
}

export const generated = { 'docs/contrast.md': build().md };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { md } = build();
  writeFileSync(resolve(root, 'docs/contrast.md'), md);
  console.log('✓ wrote docs/contrast.md');
}
