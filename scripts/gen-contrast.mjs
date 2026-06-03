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
import { skins, SKIN_NAMES } from '../tokens/skins.js';
import { charts } from '../tokens/charts.js';
import { resolveColor } from './gen-charts.mjs';
import { parseOklch } from './lib/oklch.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const HEX = /^#([0-9a-f]{3,8})$/i;
const RGBA_FN = /^rgba?\(([^)]+)\)$/i;

/** Parse a resolved literal (#rrggbb, rgba(…), or oklch(…)) → [r,g,b,a]. */
function rgba(v) {
  const s = String(v).trim();
  const hexM = HEX.exec(s);
  if (hexM) {
    // Expand 3/4-digit shorthand to 6/8 ("abc" → "aabbcc").
    const h = hexM[1].length <= 4 ? [...hexM[1]].map((c) => c + c).join('') : hexM[1];
    if (h.length !== 6 && h.length !== 8) return null;
    return [
      Number.parseInt(h.slice(0, 2), 16),
      Number.parseInt(h.slice(2, 4), 16),
      Number.parseInt(h.slice(4, 6), 16),
      h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1,
    ];
  }
  const fn = RGBA_FN.exec(s);
  if (fn) {
    const p = fn[1].split(/[\s,/]+/).filter(Boolean);
    const num = (x, pctScale) =>
      x?.endsWith('%') ? (Number.parseFloat(x) / 100) * pctScale : Number.parseFloat(x);
    const out = [num(p[0], 255), num(p[1], 255), num(p[2], 255), p[3] != null ? num(p[3], 1) : 1];
    // Reject anything that didn't parse to a finite number (e.g. a
    // percent alpha the old `+x` coercion silently turned into NaN —
    // which would then slip the gate as a non-comparable ratio).
    return out.every((n) => Number.isFinite(n)) ? out : null;
  }
  return parseOklch(s); // #rrggbb / rgba() above; oklch() here (shared lib)
}

/** color-mix(in srgb, A p%, B) for two OPAQUE colours, per CSS Color 5 (gamma
 *  sRGB) — the only form the accent ramp uses. Returns an `rgb(r,g,b)` string.
 *  Used to derive a skin's --accent-strong/-text from its (oklch) --accent the
 *  same way css/tokens.css does, so the skin audit measures real values. */
function mixSrgbOpaque(aRaw, bRaw, aPct) {
  const a = rgba(aRaw);
  const b = rgba(bRaw);
  if (!a || !b) return null;
  const w = aPct / 100;
  const ch = (i) => Math.round(a[i] * w + b[i] * (1 - w));
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
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

/** APCA (APCA-W3 0.1.9) lightness contrast, |Lc|. Advisory only — a
 *  perceptual cross-check that accounts for polarity (light-on-dark vs
 *  dark-on-light), which WCAG 2.1's symmetric ratio cannot. NOT gated:
 *  WCAG 3 is a Working Draft, so WCAG 2.1 AA stays the hard floor. */
export function apcaLc(fgRaw, bgRaw) {
  const fg = rgba(fgRaw);
  const bg = rgba(bgRaw);
  if (!fg || !bg) return null;
  const bgO = bg[3] >= 1 ? bg.slice(0, 3) : flatten(bg, [255, 255, 255]);
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
 * `--accent` to the skin's (oklch) value and recomputing `--accent-text`
 * (= `--accent-strong`) with the same color-mix the core palette uses
 * (83% accent + black in light, 84% accent + white in dark). `--focus-ring`
 * follows `--accent`. Everything else (canvas, status) is the base palette.
 */
function skinPalette(name, theme, base) {
  const accent = skins[name][theme]['--accent'];
  const strong =
    theme === 'light' ? mixSrgbOpaque(accent, '#000000', 83) : mixSrgbOpaque(accent, '#ffffff', 84);
  return {
    ...base,
    '--accent': accent,
    '--accent-strong': strong,
    '--accent-text': strong,
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

const FLOOR = { text: 4.5, ui: 3, decorative: 0 };
const LABEL = {
  text: 'AA text (4.5:1)',
  ui: 'UI / large (3:1)',
  decorative: 'Decorative (1.4.11-exempt)',
};

/** Audit one theme → rows + worst-case failure list. */
export function auditTheme(palette, pairs = PAIRS) {
  const rows = [];
  for (const [fg, bg, role, level] of pairs) {
    const fv = palette[fg];
    const bv = palette[bg];
    const r = fv != null && bv != null ? ratio(fv, bv) : null;
    const apca = fv != null && bv != null ? apcaLc(fv, bv) : null;
    const floor = FLOOR[level];
    // Decorative rows are reported, never gated (WCAG 1.4.11 exempt).
    const gated = level !== 'decorative';
    const pass = !gated || (r != null && r >= floor);
    rows.push({ fg, bg, role, level, fv, bv, ratio: r, apca, floor, gated, pass });
  }
  return rows;
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

const apcaCell = (n) => (n == null ? 'n/a' : `Lc ${Math.round(n)}`);

function themeTable(rows) {
  const head =
    '| Foreground | Background | Role | Held to | Ratio | APCA _(advisory)_ | Verdict |\n' +
    '| --- | --- | --- | --- | --- | --- | --- |';
  const body = rows
    .map(
      (x) =>
        `| \`${x.fg}\` | \`${x.bg}\` | ${x.role} | ${LABEL[x.level]} | ${r2(x.ratio)} | ${apcaCell(x.apca)} | ${verdict(x)} |`,
    )
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
  \`--accent-text\`, and the primary-button label.
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
background before measuring — the ratio the eye actually gets.

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
  \`--accent\` yourself is your contrast obligation (see [theming.md](theming.md)
  → "Re-brand obligations"); this table is the guarantee for the *shipped*
  palettes and skins only.
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { md } = build();
  writeFileSync(resolve(root, 'docs/contrast.md'), md);
  console.log('✓ wrote docs/contrast.md');
}
