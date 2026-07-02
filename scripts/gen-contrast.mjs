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
import { resolve } from 'node:path';
import { buildResolved } from './gen-resolved.mjs';
import { skins, SKIN_NAMES } from '../tokens/skins.js';
import { charts } from '../tokens/charts.js';
import { resolveColor } from './gen-charts.mjs';
import { parseCssColor, srgbToLinear } from './lib/oklch.mjs';

import { repoRoot as root, isMain } from './lib/emit.mjs';
import { log } from './lib/stdio.mjs';

/** color-mix(in srgb, A p%, B) per CSS Color 5 (gamma sRGB,
 * alpha-premultiplied). Returns a resolved `rgb()`/`rgba()` string. Used to
 * derive a skin's accent family from its (oklch) --accent the same way
 * css/tokens.css does, so the skin audit measures real values. */
function mixSrgb(aRaw, bRaw, aPct) {
  const a = parseCssColor(aRaw);
  const b = parseCssColor(bRaw);
  if (!a || !b) return null;
  const w = aPct / 100;
  const oa = a[3] * w + b[3] * (1 - w);
  const ch = (i) => (oa === 0 ? 0 : (a[i] * a[3] * w + b[i] * b[3] * (1 - w)) / oa);
  const r = Math.round(ch(0));
  const g = Math.round(ch(1));
  const bl = Math.round(ch(2));
  if (oa >= 1) return `rgb(${r}, ${g}, ${bl})`;
  return `rgba(${r}, ${g}, ${bl}, ${Number(oa.toFixed(4))})`;
}

/** Composite a possibly-translucent fg over an opaque bg (simple alpha). */
function flatten(fg, bg) {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)];
}

/** WCAG 2.1 relative luminance of an opaque sRGB triple. */
function luminance([r, g, b]) {
  const lin = (c) => srgbToLinear(c / 255);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Resolve an opaque background, flattening translucent fills over a base. */
function opaqueBg(bg, baseRaw) {
  if (bg[3] >= 1) return bg.slice(0, 3);
  const base = parseCssColor(baseRaw ?? '#ffffff');
  const baseOpaque = base && base[3] >= 1 ? base.slice(0, 3) : [255, 255, 255];
  return flatten(bg, baseOpaque);
}

/** Contrast ratio of fg (over bg) against bg. Translucent bg may pass a base. */
export function ratio(fgRaw, bgRaw, baseRaw) {
  const fg = parseCssColor(fgRaw);
  const bg = parseCssColor(bgRaw);
  if (!fg || !bg) return null;
  const bgOpaque = opaqueBg(bg, baseRaw);
  const fgOpaque = fg[3] >= 1 ? fg.slice(0, 3) : flatten(fg, bgOpaque);
  const L1 = luminance(fgOpaque);
  const L2 = luminance(bgOpaque);
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

/** APCA (APCA-W3 0.1.9) lightness contrast, |Lc|. Advisory only — a
 *  perceptual cross-check that accounts for polarity (light-on-dark vs
 *  dark-on-light), which WCAG 2.1's symmetric ratio cannot. NOT gated:
 *  WCAG 3 is a Working Draft, so WCAG 2.1 AA stays the hard floor. */
export function apcaLc(fgRaw, bgRaw, baseRaw) {
  const fg = parseCssColor(fgRaw);
  const bg = parseCssColor(bgRaw);
  if (!fg || !bg) return null;
  const bgO = opaqueBg(bg, baseRaw);
  const fgO = fg[3] >= 1 ? fg.slice(0, 3) : flatten(fg, bgO);
  // APCA luminance: simple ^2.4, Nimbusic coefficients (no WCAG piecewise).
  const Y = ([r, g, b]) =>
    0.2126729 * (r / 255) ** 2.4 + 0.7151522 * (g / 255) ** 2.4 + 0.072175 * (b / 255) ** 2.4;
  const soft = (y) => (y < 0.022 ? y + (0.022 - y) ** 1.414 : y);
  const Ytxt = soft(Y(fgO));
  const Ybg = soft(Y(bgO));
  let Sapc;
  if (Ybg > Ytxt)
    Sapc = (Ybg ** 0.56 - Ytxt ** 0.57) * 1.14; // dark text / light bg
  else Sapc = (Ybg ** 0.65 - Ytxt ** 0.62) * 1.14; // light text / dark bg
  let Lc = 0;
  if (Math.abs(Sapc) >= 0.1) Lc = Sapc > 0 ? (Sapc - 0.027) * 100 : (Sapc + 0.027) * 100;
  return Math.abs(Lc);
}

/**
 * Build a skin's accent family over a base (resolved) palette — re-pointing
 * `--accent` to the skin's (oklch) value and recomputing the derived accent
 * family exactly like css/tokens.css (`--accent-text`/strong plus the soft
 * translucent tints). `--focus-ring` follows `--accent`. Everything else
 * (canvas, status) is the base palette.
 */
function skinPalette(name, theme, base) {
  const accent = skins[name][theme]['--accent'];
  const isLight = theme === 'light';
  const strong = mixSrgb(accent, isLight ? '#000000' : '#ffffff', isLight ? 83 : 80);
  return {
    ...base,
    '--accent': accent,
    '--accent-strong': strong,
    '--accent-text': strong,
    '--accent-soft': mixSrgb(accent, 'transparent', isLight ? 10 : 14),
    '--bg-accent': mixSrgb(accent, 'transparent', isLight ? 6 : 8),
    '--focus-ring': accent,
  };
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
  ['--text-soft', '--surface-muted', 'Secondary text on a muted panel', 'text'],
  ['--text-dim', '--bg', 'Dim/meta text on page background', 'text'],
  ['--text-dim', '--surface', 'Dim/meta text on a card', 'text'],
  // Muted-panel dim text is the tightest real-world margin (~4.7:1) and
  // is rendered (forms/disclosure use --panel-soft as a fill), so it is
  // gated, not left to chance.
  ['--text-dim', '--surface-muted', 'Dim/meta text on a muted panel', 'text'],
  // The accent used *as foreground text* — theming.md calls this the
  // AA-safe one, so it is gated at full text level deliberately.
  ['--accent-text', '--bg', 'Accent text on page background', 'text'],
  ['--accent-text', '--surface', 'Accent text on a card', 'text'],
  // Component text on accent tints uses the neutral text ramp, not accent text.
  // Gate the real component case over the darkest common neutral surface so a
  // soft accent tag/badge cannot regress while the tint remains translucent.
  [
    '--text-soft',
    '--accent-soft',
    'Neutral tag/badge text on an accent tint',
    'text',
    '--surface-muted',
  ],
  // Accent text on an accent TINT is a diagnostic only: it is the inverse role
  // (accent-coloured text) and should not be used for small component labels.
  // It stays visible in the table because authors often try it when re-skinning.
  ['--accent-text', '--accent-soft', 'Accent text on an accent tint', 'advisory'],
  ['--accent-text', '--bg-accent', 'Accent text on an accent-tinted surface', 'advisory'],
  // Label on the primary (filled accent) button.
  ['--button-text', '--accent', 'Label on the primary button', 'text'],
  // On-accent ink — a label on ANY accent fill (button, badge, chart bar, a
  // themed D2/Vega node). Same resolved value as --button-text, gated under the
  // semantic name so an author can reach for "ink on accent" and get a
  // guaranteed-readable token instead of --accent-text (which is the inverse:
  // accent-coloured text for a neutral background).
  ['--on-accent', '--accent', 'Ink on an accent fill', 'text'],
  // Non-text UI: focus ring, accent fill, status colour, strong hairline.
  ['--focus-ring', '--bg', 'Focus ring vs page background', 'ui'],
  ['--focus-ring', '--surface', 'Focus ring vs a card', 'ui'],
  ['--accent', '--bg', 'Accent fill vs page background', 'ui'],
  ['--success', '--surface', 'Success indicator vs a card', 'ui'],
  ['--warning', '--surface', 'Warning indicator vs a card', 'ui'],
  ['--danger', '--surface', 'Danger indicator vs a card', 'ui'],
  ['--info', '--surface', 'Info indicator vs a card', 'ui'],
  // Hairlines are a deliberate identity choice and WCAG 1.4.11 exempts
  // decorative borders that are not the sole identifier of a control
  // (the framework re-asserts boundaries under forced-colors /
  // data-contrast="high" — see theming.md). Reported for transparency,
  // NOT gated: faking a pass would be the dishonest move here.
  ['--line-strong', '--surface', 'Strong hairline vs a card', 'decorative'],
];

const FLOOR = { text: 4.5, ui: 3, decorative: 0, advisory: 0 };
const LABEL = {
  text: 'AA text (4.5:1)',
  ui: 'UI / large (3:1)',
  decorative: 'Decorative (1.4.11-exempt)',
  advisory: 'Advisory (translucent tint — not gated)',
};

/** Audit one theme → rows + worst-case failure list. */
export function auditTheme(palette, pairs = PAIRS) {
  const rows = [];
  for (const [fg, bg, role, level, base] of pairs) {
    const values = contrastValues(palette, { fg, bg, base });
    const { r, apca } = contrastMetrics(values);
    const floor = FLOOR[level];
    // Decorative (1.4.11-exempt) and advisory (translucent-tint, model can't
    // fairly flatten per-theme) rows are reported, never gated.
    const gated = level !== 'decorative' && level !== 'advisory';
    const pass = !gated || (r != null && r >= floor);
    rows.push({ fg, bg, base, role, level, ...values, ratio: r, apca, floor, gated, pass });
  }
  return rows;
}

function contrastValues(palette, { fg, bg, base }) {
  return {
    fv: palette[fg],
    bv: palette[bg],
    basev: base ? palette[base] : undefined,
    needsBase: Boolean(base),
  };
}

function contrastInputsPresent({ fv, bv, basev, needsBase }) {
  return fv != null && bv != null && (!needsBase || basev != null);
}

function contrastMetrics(values) {
  if (!contrastInputsPresent(values)) return { r: null, apca: null };
  return {
    r: ratio(values.fv, values.bv, values.basev),
    apca: apcaLc(values.fv, values.bv, values.basev),
  };
}

// The accent-touching subset of PAIRS — what a colorway can move (it only
// re-points the accent; canvas + status are unchanged, so re-auditing them
// would just re-report the core result).
const SKIN_PAIRS = PAIRS.filter(([fg, bg]) =>
  [fg, bg].some((t) => /(^--accent|accent-text|button-text|focus-ring)/.test(t)),
);

/** Audit every shipped colorway (both themes) — same floors as the core. */
export function auditSkins(resolved) {
  const out = [];
  for (const name of SKIN_NAMES) {
    for (const theme of ['light', 'dark']) {
      out.push({
        name,
        label: skins[name].label,
        theme,
        rows: auditTheme(skinPalette(name, theme, resolved[theme]), SKIN_PAIRS),
      });
    }
  }
  return out;
}

export function audit() {
  const resolved = buildResolved();
  return {
    light: auditTheme(resolved.light),
    dark: auditTheme(resolved.dark),
    skins: auditSkins(resolved),
  };
}

const r2 = (n) => (n == null ? 'n/a' : `${n.toFixed(2)}:1`);

function verdict(x) {
  if (!x.gated) return 'ℹ️ not gated';
  return x.pass ? '✅ pass' : '❌ **FAIL**';
}

// One decimal, not rounded-to-integer: the advisory APCA shortfall the gate
// itself sees (e.g. Lc 44.9) must not round up to a passing-looking `Lc 45` in
// the doc.
const apcaCell = (n) => (n == null ? 'n/a' : `Lc ${n.toFixed(1)}`);

function themeTable(rows) {
  const head =
    '| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |\n' +
    '| --- | --- | --- | --- | --- | --- | --- |';
  const body = rows
    .map((x) => {
      const bg = x.base ? `\`${x.bg}\` over \`${x.base}\`` : `\`${x.bg}\``;
      return `| \`${x.fg}\` | ${bg} | ${x.role} | ${LABEL[x.level]} | ${r2(x.ratio)} | ${apcaCell(x.apca)} | ${verdict(x)} |`;
    })
    .join('\n');
  return `${head}\n${body}`;
}

function datavizSection(resolved) {
  const themeBlock = (theme) => {
    const bg = resolved[theme]['--bg'];
    const rows = charts[theme].categorical
      .map((v, i) => {
        const hex = resolveColor(v, theme);
        const r = ratio(hex, bg);
        return `| ${i + 1}${i === 0 ? ' _(accent)_' : ''} | \`${hex}\` | ${r2(r)} | ${apcaCell(apcaLc(hex, bg))} |`;
      })
      .join('\n');
    return (
      `### ${theme[0].toUpperCase()}${theme.slice(1)} theme — categorical vs \`--bg\`\n\n` +
      `| Series | Colour | Ratio _(advisory)_ | APCA _(advisory)_ |\n| --- | --- | --- | --- |\n${rows}`
    );
  };
  return `${themeBlock('light')}\n\n${themeBlock('dark')}`;
}

function build() {
  const { light, dark, skins: skinAudits } = audit();
  const skinRows = skinAudits.flatMap((s) => s.rows);
  const allPass = [...light, ...dark, ...skinRows].filter((x) => x.gated).every((x) => x.pass);
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
  \`--accent-text\`, neutral text on soft accent-tint components, and the
  primary-button label.
- **Non-text UI** (focus ring, accent fill, status colour) is guaranteed
  **3:1** (1.4.11 non-text contrast / the large-text bar). These are
  deliberately *not* held to 4.5:1 — a focus
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
background before measuring. When a translucent background is a component
tint, the table names the neutral base it is composited over.

Overall: **${allPass ? 'all contractual pairings meet their floor ✅' : 'one or more pairings are below floor — see ❌ rows ❌'}**.

## Light theme

${themeTable(light)}

## Dark theme

${themeTable(dark)}

## Display colorways (skins)

The opt-in \`data-bronto-skin\` colorways (\`@ponchia/ui/css/skins.css\`,
authored in \`tokens/skins.js\`) re-point the one accent to a different single
hue. Because a shipped colorway is part of the framework — not an arbitrary
consumer re-brand — **its accent is gated to the same floors as the core**:
the primary-button label, accent-as-text, and the focus ring/accent fill. Only
the accent-touching pairings are shown (a skin leaves the canvas and status
palette untouched). Accents are authored in OKLCH; \`--accent-text\` is the
\`color-mix\`-derived \`--accent-strong\`, exactly as in the core palette.

${skinAudits.map((s) => `### ${s.label} — ${s.theme}\n\n${themeTable(s.rows)}`).join('\n\n')}

## Data-viz palette (advisory)

The opt-in Tier-4 chart palette (\`@ponchia/ui/css/dataviz.css\`, authored in
\`tokens/charts.js\`) is gated differently: categorical series are held to
**mutual distinguishability under normal + simulated protan/deutan/tritan
vision** (\`check:charts\`, OKLab ΔE), and colour is **never the sole signal** —
each series ships a matching \`--chart-pattern-*\` dot-matrix fill. So the
WCAG ratios below are **advisory** (a chart fill is not body text); use them to
pick a darker series for thin lines/points, or rely on the pattern. Series 1 is
the brand accent.

${datavizSection(buildResolved())}

## Scope & caveats

- This gates the **framework token contract** (core palette **and** every
  shipped colorway), not arbitrary consumer re-brands. Re-accenting via
  \`--accent\` yourself is your contrast obligation (see
  [Re-brand obligations](theming.md#re-brand-obligations)); this table is the
  guarantee for the *shipped* palettes and skins only.
- Status colours (\`--success\` / \`--warning\` / \`--danger\`) are gated
  as **indicators** (3:1). If you set status text *as body copy* on a
  surface, verify 4.5:1 yourself or pair it with an icon/label.
- The gated **Ratio** is sRGB WCAG 2.1 AA — the testable legal / axe-compatible
  baseline the e2e suite also asserts. The **APCA** column (APCA-W3 0.1.9 \`Lc\`)
  is **advisory only**: a perceptual cross-check that, unlike WCAG 2.1's
  symmetric ratio, accounts for polarity and is the WCAG 3 candidate. It does
  **not** gate the build while WCAG 3 is a Working Draft — use it to tune
  quality, not to override the WCAG 2.1 floor. As a rough read, body text wants
  \`Lc\` ≥ 75 and non-text/large ≥ 45–60.
`;
  return { md, allPass, light, dark, skins: skinAudits };
}

export const generated = { 'docs/contrast.md': build().md };

if (isMain(import.meta.url)) {
  const { md } = build();
  writeFileSync(resolve(root, 'docs/contrast.md'), md);
  log('✓ wrote docs/contrast.md');
}
