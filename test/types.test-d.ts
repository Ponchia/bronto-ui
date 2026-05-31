/**
 * Type-only gate (compiled by `npm run check:types`, never executed).
 * Proves the published .d.ts are sound *and* that the generated literal
 * `cls` / token types actually reject typos — the concrete payoff of
 * making the declarations generated-from-source. A regression here is a
 * consumer-facing break, so it blocks `npm run check`.
 */
import { cls, ui, cx, type ClassValue } from '../classes/index.js';
import tokens, { themeColor, cssVars, type ThemeName } from '../tokens/index.js';
import {
  initThemeToggle,
  initDialog,
  initDotGlyph,
  toast,
  type Cleanup,
} from '../behaviors/index.js';
import {
  renderGlyph,
  glyphCells,
  glyph,
  GLYPH_SIZE,
  GLYPH_NAMES,
  type GlyphName,
  type GlyphCell,
} from '../glyphs/glyphs.js';
import { skins, SKIN_NAMES, type SkinName } from '../tokens/skins.js';
import { charts, type ChartTokenName } from '../tokens/charts.js';

// cls values are literal, not widened to `string`.
const btn: 'ui-button' = cls.button;
const appShell: 'ui-app-shell' = cls.appShell;
const tt: 'ui-themetoggle__button' = cls.themetoggleButton;

// @ts-expect-error — unknown cls key is now a compile error (was `string`).
cls.definitelyNotAKey;

// Recipes return strings; options are typed unions.
const a: string = ui.button({ variant: 'ghost' });
const b: string = ui.tab({ active: true });
// @ts-expect-error — invalid variant rejected.
ui.button({ variant: 'nope' });

const parts: ClassValue = ['a', false, ['b'], null];
const joined: string = cx(parts, 'extra', undefined);

// themeColor is ThemeName-typed; keys stay kebab-case.
const dark = themeColor('dark');
const soft: string = dark['accent-soft'];
const th: ThemeName = 'light';
// @ts-expect-error — arbitrary string is not a ThemeName.
themeColor('drak');

const accentVar: string = cssVars.light['--accent'];
// @ts-expect-error — unknown token name rejected by the literal union.
cssVars.light['--not-a-token'];
const scaleMd: string = tokens.scale['space-md'];

// Behaviors: every initializer returns a Cleanup.
const stop: Cleanup = initThemeToggle();
const stopDlg: Cleanup = initDialog({ root: document });
const dismiss: Cleanup = toast('hi', { tone: 'success', title: 'OK', duration: 0 });
// Runtime-public options must be type-public too (regression: ToastOpts
// previously stopped at tone/title/duration while the runtime accepted
// these and the behavior tests exercised them).
const dismiss2: Cleanup = toast('err', { tone: 'danger', assertive: true, closable: true });
// @ts-expect-error — message is required.
toast();
// @ts-expect-error — assertive is a boolean.
toast('x', { assertive: 'yes' });

// Glyphs: the subpath types are sound and the GlyphName union rejects typos.
const stopGlyph: Cleanup = initDotGlyph({ root: document });
const glyphHtml: string = renderGlyph('check', {
  label: 'Done',
  grid: false,
  solid: true,
  anim: 'reveal',
  dot: '0.5rem',
});
// @ts-expect-error — anim is a closed union.
renderGlyph('check', { anim: 'spin' });
const cells: GlyphCell[] = glyphCells('spark');
const cellOn: boolean = cells[0].on;
const gname: GlyphName = 'heart';
const rows = glyph(gname); // readonly string[] | undefined
const size: 16 = GLYPH_SIZE; // narrows to the literal
const firstName: GlyphName = GLYPH_NAMES[0];
// Dynamic dispatch: an arbitrary string is accepted (returns the '' fallback),
// so a CMS/config-supplied name needs no cast.
const dyn: string = renderGlyph('icon-from-config');
// …but the GlyphName union itself still rejects typo'd literals.
// @ts-expect-error — not a registered glyph name.
const bad: GlyphName = 'definitely-not-a-glyph';
void [dyn, bad];

// Colorways: the ./skins subpath types are sound and SkinName rejects typos.
const skinName: SkinName = 'phosphor-green';
const firstSkin: SkinName = SKIN_NAMES[0];
const skinLabel: string = skins[skinName].label;
// @ts-expect-error — not a registered colorway name.
const badSkin: SkinName = 'neon-pink';
void [skinName, firstSkin, skinLabel, badSkin];

// Data-viz: the ./charts subpath types are sound and ChartTokenName is literal.
const chartTok: ChartTokenName = '--chart-1';
const series1: string = charts.light.categorical[0];
// @ts-expect-error — not a categorical chart token.
const badChart: ChartTokenName = '--chart-99';
void [chartTok, series1, badChart];

void [
  btn,
  appShell,
  tt,
  a,
  b,
  joined,
  soft,
  th,
  accentVar,
  scaleMd,
  stop,
  stopDlg,
  dismiss,
  dismiss2,
  stopGlyph,
  glyphHtml,
  cells,
  cellOn,
  rows,
  size,
  firstName,
];
