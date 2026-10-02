/**
 * @ponchia/ui/renderer — the live theme, resolved for renderers that cannot
 * read CSS.
 *
 * A canvas, WebGL or SVG-baking renderer (Vega, xterm, a graph or map engine,
 * a 3D scene) is handed literal colours, so a page that switches theme, skin,
 * contrast or surface at runtime has to resolve its tokens before every paint
 * that matters. The static exports (`charts.json`, `tokens/vega.js`) cannot
 * follow a skin or the OLED preset; this module reads the page instead.
 *
 * - `readTokens()` resolves the bronto roles a renderer needs to sRGB literals.
 * - `observeTokens()` calls back when anything that moves them changes.
 * - `vegaConfig()` and `xtermTheme()` map those tokens to two renderers'
 *   configuration shapes. They are pure: no renderer is imported or run.
 * - `parseColor()` / `formatColor()` / `resolveColor()` are the conversions
 *   underneath, for any other target.
 *
 * SSR-safe: nothing touches the DOM until a function that needs it is called.
 */
import { charts } from '../tokens/charts.js';
import { cssVars } from '../tokens/index.js';

/**
 * A colour as sRGB channels (0–255) and alpha (0–1).
 * @typedef {{ r: number, g: number, b: number, alpha: number }} Rgba
 */

/**
 * The bronto roles a renderer draws with, resolved to literals: opaque colours
 * as `#rrggbb`, translucent ones as `rgba(r, g, b, a)`.
 * @typedef {object} RendererTokens
 * @property {'light' | 'dark'} scheme The resolved scheme of the page background.
 * @property {string} bg Page background (`--bg`).
 * @property {string} bgElevated A lifted page background (`--bg-elevated`).
 * @property {string} panel The surface a renderer usually draws on (`--panel`).
 * @property {string} panelStrong A raised surface (`--panel-strong`).
 * @property {string} text Primary ink (`--text`).
 * @property {string} textSoft Secondary ink (`--text-soft`).
 * @property {string} textDim Tertiary ink (`--text-dim`).
 * @property {string} line Hairline and grid (`--line`).
 * @property {string} lineStrong Axis, domain and rule (`--line-strong`).
 * @property {string} edge A line that carries meaning: a relationship,
 *   connector or leader (`--edge`). 3:1 against the surface, unlike `line`.
 * @property {string} accent The one accent (`--accent`).
 * @property {string} accentText Accent as text on the page (`--accent-text`).
 * @property {string} onAccent Ink on an accent fill (`--on-accent`).
 * @property {string} focus Focus ring (`--focus-ring`).
 * @property {string} selection A translucent selection wash over `panel`.
 * @property {string} success Status: success.
 * @property {string} warning Status: warning.
 * @property {string} danger Status: danger.
 * @property {string} info Status: info.
 * @property {string} sans The sans font stack.
 * @property {string} mono The monospace font stack.
 * @property {string[]} categorical Eight categorical hues, fixed order.
 * @property {string[]} categoricalTint Each hue's wash over `panel`.
 * @property {string[]} categoricalInk Each hue as text on `panel` and its tint.
 * @property {string[]} sequential One-hue ramp; step 1 nearest the surface.
 * @property {string[]} diverging Negative … neutral … positive ramp.
 */

const CATEGORICAL = 8;

// --- Parsing --------------------------------------------------------------------

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);

/** @param {number[]} m @param {number[]} v */
const mul = (m, v) =>
  [0, 1, 2].map((i) => m[i * 3] * v[0] + m[i * 3 + 1] * v[1] + m[i * 3 + 2] * v[2]);

// CSS Color 4 matrices.
const XYZ65_TO_LSRGB = [
  3.2409699419045226, -1.537383177570094, -0.4986107602930034, -0.9692436362808796,
  1.8759675015077202, 0.04155505740717559, 0.05563007969699366, -0.20397695888897652,
  1.0569715142428786,
];
const LP3_TO_XYZ65 = [
  0.4865709486482162, 0.26566769316909306, 0.1982172852343625, 0.2289745640697488,
  0.6917385218365064, 0.079286914093745, 0, 0.04511338185890264, 1.043944368900976,
];
const XYZ50_TO_XYZ65 = [
  0.955473421488075, -0.02309845494876471, 0.06325924320057072, -0.0283697093338637,
  1.0099953980813041, 0.021041441191917323, 0.012314014864481998, -0.020507649298898964,
  1.330365926242124,
];
const LSRGB_TO_LMS = [
  0.4122214708, 0.5363325363, 0.0514459929, 0.2119034982, 0.6806995451, 0.1073969566, 0.0883024619,
  0.2817188376, 0.6299787005,
];
const LMS_TO_OKLAB = [
  0.2104542553, 0.793617785, -0.0040720468, 1.9779984951, -2.428592205, 0.4505937099, 0.0259040371,
  0.7827717662, -0.808675766,
];

/** @param {number} L @param {number} a @param {number} b */
function oklabToLinear(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** @param {number} L @param {number} a @param {number} b CIE Lab (D50). */
function labToLinear(L, a, b) {
  const k = 24389 / 27;
  const e = 216 / 24389;
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const xyz50 = [
    ((fx ** 3 > e ? fx ** 3 : (116 * fx - 16) / k) * 0.3457) / 0.3585,
    L > k * e ? fy ** 3 : L / k,
    ((fz ** 3 > e ? fz ** 3 : (116 * fz - 16) / k) * (1 - 0.3457 - 0.3585)) / 0.3585,
  ];
  return mul(XYZ65_TO_LSRGB, mul(XYZ50_TO_XYZ65, xyz50));
}

/** @param {number[]} linear @param {number} alpha @returns {Rgba} */
const fromLinearRgb = (linear, alpha) => {
  const [r, g, b] = linear.map((x) => Math.round(clamp01(fromLinear(x)) * 255));
  return { r, g, b, alpha: clamp01(alpha) };
};

/**
 * One channel token: `none`, a number, a percentage (scaled by `pct`), or an
 * angle (degrees, `rad`, `grad`, `turn`).
 * @param {string} token @param {number} pct
 */
function channel(token, pct = 1) {
  if (token === 'none') return 0;
  const n = Number.parseFloat(token);
  if (!Number.isFinite(n)) return Number.NaN;
  if (token.endsWith('%')) return (n / 100) * pct;
  if (token.endsWith('rad')) return (n * 180) / Math.PI;
  if (token.endsWith('grad')) return n * 0.9;
  if (token.endsWith('turn')) return n * 360;
  return n;
}

/** Channels and alpha; a comma list (legacy `rgba()`/`hsla()`) carries alpha
 *  as its fourth item. @param {string} body */
function split(body) {
  const [main, alpha] = body.split('/');
  const legacy = main.includes(',');
  const parts = main.replace(/,/g, ' ').trim().split(/\s+/);
  const legacyAlpha = legacy && alpha === undefined && parts.length === 4 ? parts.pop() : undefined;
  const a = alpha?.trim() ?? legacyAlpha;
  return { parts, alpha: a === undefined ? 1 : channel(a, 1) };
}

/** @param {string} h @returns {Rgba | null} */
function parseHex(h) {
  const full = h.length <= 4 ? [...h].map((c) => c + c).join('') : h;
  if (full.length !== 6 && full.length !== 8) return null;
  const n = (i) => Number.parseInt(full.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), alpha: full.length === 8 ? n(6) / 255 : 1 };
}

/** @param {number} h @param {number} sat @param {number} light @param {number} alpha */
function hslToRgba(h, sat, light, alpha) {
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return light - sat * Math.min(light, 1 - light) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255), alpha };
}

/** Polar (L, C, H°) to rectangular (L, a, b). @param {string[]} p @param {number} lScale @param {number} cScale */
const polar = (p, lScale, cScale) => {
  const C = channel(p[1], cScale);
  const H = (channel(p[2]) * Math.PI) / 180;
  return [channel(p[0], lScale), C * Math.cos(H), C * Math.sin(H)];
};

/** `color()` spaces, each to linear sRGB. @type {Record<string, (v: number[]) => number[]>} */
const COLOR_SPACES = {
  srgb: (v) => v.map(toLinear),
  'srgb-linear': (v) => v,
  'display-p3': (v) => mul(XYZ65_TO_LSRGB, mul(LP3_TO_XYZ65, v.map(toLinear))),
  xyz: (v) => mul(XYZ65_TO_LSRGB, v),
  'xyz-d65': (v) => mul(XYZ65_TO_LSRGB, v),
  'xyz-d50': (v) => mul(XYZ65_TO_LSRGB, mul(XYZ50_TO_XYZ65, v)),
};

/** Functional notations. @type {Record<string, (p: string[], alpha: number) => Rgba | null>} */
const FUNCTIONS = {
  rgb: (p, alpha) => {
    const [r, g, b] = p.map((x) => Math.round(channel(x, 255)));
    return { r, g, b, alpha };
  },
  hsl: (p, alpha) =>
    hslToRgba(channel(p[0]), channel(p[1], 100) / 100, channel(p[2], 100) / 100, alpha),
  oklab: (p, alpha) =>
    fromLinearRgb(oklabToLinear(channel(p[0], 1), channel(p[1], 0.4), channel(p[2], 0.4)), alpha),
  oklch: (p, alpha) => {
    const [L, a, b] = polar(p, 1, 0.4);
    return fromLinearRgb(oklabToLinear(L, a, b), alpha);
  },
  lab: (p, alpha) =>
    fromLinearRgb(labToLinear(channel(p[0], 100), channel(p[1], 125), channel(p[2], 125)), alpha),
  lch: (p, alpha) => {
    const [L, a, b] = polar(p, 100, 150);
    return fromLinearRgb(labToLinear(L, a, b), alpha);
  },
  color: ([space, ...rest], alpha) => {
    const toLinearRgb = COLOR_SPACES[space];
    return toLinearRgb
      ? fromLinearRgb(toLinearRgb(rest.slice(0, 3).map((x) => channel(x, 1))), alpha)
      : null;
  },
};
FUNCTIONS.rgba = FUNCTIONS.rgb;
FUNCTIONS.hsla = FUNCTIONS.hsl;

/** @param {Rgba | null} c @returns {Rgba | null} */
function finite(c) {
  if (!c || ![c.r, c.g, c.b, c.alpha].every(Number.isFinite)) return null;
  const byte = (x) => Math.min(255, Math.max(0, x));
  return { r: byte(c.r), g: byte(c.g), b: byte(c.b), alpha: clamp01(c.alpha) };
}

/**
 * Parse a resolved CSS colour to sRGB, gamut-clipped: hex, `rgb()`, `hsl()`,
 * `oklch()`, `oklab()`, `lab()`, `lch()`, `color(srgb | srgb-linear |
 * display-p3 | xyz | xyz-d65 | xyz-d50 …)` and `transparent`. Anything else —
 * `var()`, `color-mix()`, `light-dark()`, a named colour — returns null; use
 * `resolveColor()` to have the browser compute it first.
 * @param {string} value
 * @returns {Rgba | null}
 */
export function parseColor(value) {
  const s = String(value ?? '')
    .trim()
    .toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, alpha: 0 };
  const hex = /^#([0-9a-f]{3,8})$/.exec(s);
  if (hex) return parseHex(hex[1]);
  const fn = /^([a-z-]+)\((.*)\)$/.exec(s);
  const parse = fn && Object.hasOwn(FUNCTIONS, fn[1]) ? FUNCTIONS[fn[1]] : null;
  if (!parse) return null;
  const { parts, alpha } = split(fn[2]);
  return finite(parse(parts, alpha));
}

/**
 * Serialize for a renderer: `#rrggbb` when opaque, `rgba(r, g, b, a)` when
 * not — the two forms canvas, SVG, d3-color, xterm, three.js and MapLibre
 * all accept.
 * @param {Rgba} color
 */
export function formatColor({ r, g, b, alpha }) {
  if (alpha >= 1)
    return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.round(alpha * 1000) / 1000})`;
}

/**
 * Resolve any CSS colour expression to a renderer literal, using the browser
 * for what `parseColor()` cannot compute (`var()`, `color-mix()`,
 * `light-dark()`, named colours). Returns null for an invalid colour or when no
 * document is available.
 * @param {string} value
 * @param {{ element?: Element }} [options] Context for `var()` and `light-dark()`.
 */
export function resolveColor(value, options = {}) {
  const direct = parseColor(value);
  if (direct) return formatColor(direct);
  const doc = options.element?.ownerDocument ?? globalThis.document;
  if (!doc?.documentElement) return null;
  const host = options.element ?? doc.documentElement;
  const probe = doc.createElement('span');
  probe.style.color = value;
  if (!probe.style.color) return null;
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.colorScheme = getComputedStyle(host).colorScheme;
  // var() resolves against the probe's own ancestors, so it sits in the host.
  host.append(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const parsed = parseColor(computed);
  return parsed ? formatColor(parsed) : null;
}

// --- Reading the page -------------------------------------------------------------

/** @param {Rgba} c */
const luminance = ({ r, g, b }) =>
  0.2126 * toLinear(r / 255) + 0.7152 * toLinear(g / 255) + 0.0722 * toLinear(b / 255);

/** @param {Rgba} c */
function toOklch({ r, g, b }) {
  const lms = mul(
    LSRGB_TO_LMS,
    [r, g, b].map((x) => toLinear(x / 255)),
  ).map(Math.cbrt);
  const [L, A, B] = mul(LMS_TO_OKLAB, lms);
  return { L, C: Math.hypot(A, B), H: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

/** `color-mix(in oklch, a share, b)` for opaque colours. @param {Rgba} a @param {Rgba} b @param {number} share */
function mixOklch(a, b, share) {
  const x = toOklch(a);
  const y = toOklch(b);
  const hueOf = (c, other) => (c.C < 0.02 ? other.H : c.H);
  const hx = hueOf(x, y);
  const hy = hueOf(y, x);
  let d = hy - hx;
  if (d > 180) d -= 360;
  else if (d < -180) d += 360;
  const L = x.L * share + y.L * (1 - share);
  const C = x.C * share + y.C * (1 - share);
  const H = ((hx + d * (1 - share)) * Math.PI) / 180;
  return fromLinearRgb(oklabToLinear(L, C * Math.cos(H), C * Math.sin(H)), 1);
}

/**
 * Resolve the page's bronto tokens for a renderer. Reads custom properties as
 * computed on `element` (default: the root), so a subtree that re-points them
 * is honoured. When the categorical leaf (`css/dataviz.css`) is not loaded,
 * the categorical, sequential and diverging sets fall back to the packaged
 * palette for the resolved scheme. Without a DOM it returns the packaged light
 * (or `options.scheme`) values.
 * @param {Element} [element]
 * @param {{ scheme?: 'light' | 'dark' }} [options] Force the scheme instead of reading the background.
 * @returns {RendererTokens}
 */
export function readTokens(element, options = {}) {
  const doc = element?.ownerDocument ?? globalThis.document;
  const target = element ?? doc?.documentElement;
  const style = target && typeof getComputedStyle === 'function' ? getComputedStyle(target) : null;
  const raw = (name) => style?.getPropertyValue(name).trim() ?? '';
  const color = (name, fallback) => {
    const value = raw(name);
    return (value && resolveColor(value, { element: target })) || fallback;
  };
  const bgValue = color('--bg', '');
  const scheme =
    options.scheme ??
    (bgValue
      ? luminance(/** @type {Rgba} */ (parseColor(bgValue))) < 0.2
        ? 'dark'
        : 'light'
      : 'light');
  // The packaged value for the scheme, where the token source holds a literal.
  const packaged = (name) => {
    const parsed = parseColor(cssVars[scheme]?.[name] ?? '');
    return parsed ? formatColor(parsed) : '';
  };
  const token = (name, fallback) => color(name, packaged(name) || fallback);
  const bg = bgValue || packaged('--bg');
  const panel = token('--panel', bg);
  const text = token('--text', scheme === 'dark' ? '#ffffff' : '#000000');
  const textDim = token('--text-dim', text);
  const accent = token('--accent', text);
  const line = token('--line', text);
  const list = (prefix, count, fallback) => {
    const values = Array.from({ length: count }, (_, i) => color(`${prefix}${i + 1}`, ''));
    // A partial set would silently mix the page's hues with the packaged ones.
    return values.every(Boolean)
      ? values
      : fallback.map((v) => formatColor(/** @type {Rgba} */ (parseColor(v))));
  };
  const palette = charts[scheme];
  const categorical = list('--cat-', CATEGORICAL, palette.categorical);
  const panelRgba = /** @type {Rgba} */ (parseColor(panel));
  const tints = categorical.map((hue, i) => {
    const live = color(`--cat-${i + 1}-tint`, '');
    return live || formatColor(mixOklch(/** @type {Rgba} */ (parseColor(hue)), panelRgba, 0.16));
  });
  const inks = categorical.map((hue, i) => color(`--cat-${i + 1}-ink`, '') || hue);
  const sequentialCount = Math.max(palette.sequential.length, countDeclared(raw, '--chart-seq-'));
  const divergingCount = Math.max(palette.diverging.length, countDeclared(raw, '--chart-div-'));
  return {
    scheme,
    bg,
    bgElevated: token('--bg-elevated', bg),
    panel,
    panelStrong: token('--panel-strong', panel),
    text,
    textSoft: token('--text-soft', text),
    textDim,
    line,
    lineStrong: token('--line-strong', line),
    edge: token('--edge', textDim),
    accent,
    accentText: token('--accent-text', accent),
    onAccent: token('--on-accent', scheme === 'dark' ? '#000000' : '#ffffff'),
    focus: token('--focus-ring', accent),
    selection:
      resolveColor(`color-mix(in srgb, ${accent} 27%, transparent)`, { element: target }) ??
      formatColor({ .../** @type {Rgba} */ (parseColor(accent)), alpha: 0.27 }),
    success: token('--success', accent),
    warning: token('--warning', accent),
    danger: token('--danger', accent),
    info: token('--info', accent),
    sans: raw('--sans') || cssVars.global['--sans'],
    mono: raw('--mono') || cssVars.global['--mono'],
    categorical,
    categoricalTint: tints,
    categoricalInk: inks,
    sequential: list('--chart-seq-', sequentialCount, palette.sequential),
    diverging: list('--chart-div-', divergingCount, palette.diverging),
  };
}

/** @param {(name: string) => string} raw @param {string} prefix */
function countDeclared(raw, prefix) {
  let n = 0;
  while (n < 16 && raw(`${prefix}${n + 1}`)) n += 1;
  return n;
}

const FINGERPRINTED = [
  '--bg',
  '--bg-elevated',
  '--panel',
  '--panel-strong',
  '--text',
  '--text-soft',
  '--text-dim',
  '--line',
  '--line-strong',
  '--edge',
  '--accent',
  '--accent-text',
  '--on-accent',
  '--focus-ring',
  '--success',
  '--warning',
  '--danger',
  '--info',
  '--sans',
  '--mono',
];

/**
 * The unresolved strings `readTokens` starts from. Equal strings resolve to
 * equal tokens, so comparing them costs no probe element.
 * @param {Element} target
 */
function fingerprint(target) {
  const style = getComputedStyle(target);
  const raw = (name) => style.getPropertyValue(name).trim();
  const series = (prefix) =>
    Array.from({ length: countDeclared(raw, prefix) }, (_, i) => raw(`${prefix}${i + 1}`));
  return [
    ...FINGERPRINTED.map(raw),
    ...series('--cat-'),
    ...Array.from(
      { length: CATEGORICAL },
      (_, i) => `${raw(`--cat-${i + 1}-tint`)}|${raw(`--cat-${i + 1}-ink`)}`,
    ),
    ...series('--chart-seq-'),
    ...series('--chart-div-'),
  ].join('\n');
}

/**
 * Call `callback` with fresh tokens whenever they change: after an attribute
 * on the root changes (`data-theme`, `data-bronto-skin`, `data-contrast`,
 * `data-surface`, `data-density`, `class`, `style`) and a token's value moved
 * with it, or when the system colour scheme or contrast preference changes.
 * A host that writes unrelated inline styles on the root every frame costs one
 * computed-style read per frame, not a re-resolution. Calls are coalesced to
 * one per animation frame. Returns a function that stops observing.
 * @param {(tokens: RendererTokens) => void} callback
 * @param {{ element?: Element, signal?: AbortSignal }} [options]
 * @returns {() => void}
 */
export function observeTokens(callback, options = {}) {
  const doc = options.element?.ownerDocument ?? globalThis.document;
  if (!doc?.documentElement) return () => {};
  const view = doc.defaultView ?? globalThis;
  const target = options.element ?? doc.documentElement;
  let seen = fingerprint(target);
  let frame = 0;
  let forced = false;
  let stopped = false;
  const schedule = (force) => {
    if (stopped) return;
    forced ||= force;
    if (frame) return;
    const run = () => {
      frame = 0;
      if (stopped) return;
      const next = fingerprint(target);
      // A media change can move a computed colour under an unchanged string.
      if (next === seen && !forced) return;
      seen = next;
      forced = false;
      callback(readTokens(options.element));
    };
    frame = view.requestAnimationFrame ? view.requestAnimationFrame(run) : (setTimeout(run, 16), 1);
  };
  const observer = new MutationObserver(() => schedule(false));
  observer.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: [
      'data-theme',
      'data-bronto-skin',
      'data-contrast',
      'data-surface',
      'data-density',
      'class',
      'style',
    ],
  });
  const queries = ['(prefers-color-scheme: dark)', '(prefers-contrast: more)']
    .map((q) => view.matchMedia?.(q))
    .filter(Boolean);
  const media = () => schedule(true);
  for (const q of queries) q.addEventListener('change', media);
  const stop = () => {
    stopped = true;
    observer.disconnect();
    for (const q of queries) q.removeEventListener('change', media);
    if (frame && view.cancelAnimationFrame) view.cancelAnimationFrame(frame);
  };
  options.signal?.addEventListener('abort', stop, { once: true });
  return stop;
}

// --- Renderer mappings ------------------------------------------------------------

/**
 * A Vega-Lite (default) or Vega `config` from resolved tokens: quiet chrome in
 * the bronto inks, the categorical palette as `range.category` (a single
 * series takes its first hue), the sequential ramp for ordinal/ramp/heatmap
 * scales and the diverging ramp for diverging ones. A spec's own `config`
 * still wins where Vega merges it over this one.
 * @param {RendererTokens} tokens
 * @param {{ mode?: 'vega-lite' | 'vega', narrow?: boolean, background?: string }} [options]
 *   `narrow` moves the legend under the plot and thins ticks for a small
 *   container; `background` defaults to transparent so the host surface shows.
 * @returns {Record<string, any>}
 */
export function vegaConfig(tokens, options = {}) {
  const { mode = 'vega-lite', narrow = false, background = 'transparent' } = options;
  const font = tokens.sans;
  const shared = {
    background,
    font,
    range: {
      category: [...tokens.categorical],
      ordinal: [...tokens.sequential],
      ramp: [...tokens.sequential],
      heatmap: [...tokens.sequential],
      diverging: [...tokens.diverging],
    },
    axis: {
      domainColor: tokens.lineStrong,
      gridColor: tokens.line,
      tickColor: tokens.lineStrong,
      labelColor: tokens.textSoft,
      labelFont: font,
      labelFontSize: 12,
      titleColor: tokens.text,
      titleFont: font,
      titleFontSize: 13,
      titleFontWeight: 600,
      ...(narrow ? { tickCount: 4 } : {}),
    },
    legend: {
      labelColor: tokens.textSoft,
      labelFont: font,
      labelFontSize: 12,
      titleColor: tokens.text,
      titleFont: font,
      titleFontSize: 13,
      titleFontWeight: 600,
      symbolType: 'circle',
      symbolSize: 100,
      ...(narrow ? { orient: 'bottom', direction: 'horizontal', columns: 2 } : {}),
    },
    header: {
      labelColor: tokens.textSoft,
      labelFont: font,
      titleColor: tokens.text,
      titleFont: font,
    },
    title: {
      color: tokens.text,
      font,
      fontSize: 15,
      fontWeight: 600,
      subtitleColor: tokens.textDim,
      subtitleFont: font,
      subtitleFontSize: 13,
      ...(narrow ? { limit: 280 } : {}),
    },
  };
  if (mode === 'vega')
    // Raw grammars style their own marks; these are the defaults they inherit.
    return { ...shared, text: { fill: tokens.text, font }, rule: { stroke: tokens.lineStrong } };
  return {
    ...shared,
    mark: { color: tokens.categorical[0] },
    view: { stroke: null },
    // Discrete x labels read horizontally; overlapping ones are dropped, not rotated.
    axisXDiscrete: { labelAngle: 0, labelOverlap: 'greedy', labelLimit: 120 },
    // A Vega-Lite text mark is coloured; its fill would outrank a colour encoding.
    text: { color: tokens.text, font },
    rule: { color: tokens.lineStrong },
    line: { strokeWidth: 2 },
    point: { size: 64, filled: true },
    bar: { cornerRadiusEnd: 4 },
    // Adjacent fills keep a surface-coloured gap between them.
    rect: { stroke: tokens.panel, strokeWidth: 2 },
    arc: { stroke: tokens.panel, strokeWidth: 2 },
    area: { stroke: tokens.panel, strokeWidth: 1 },
  };
}

/**
 * An xterm.js `ITheme` from resolved tokens: page ink on the page background,
 * the accent as the cursor, status colours for red/green/yellow/blue and the
 * categorical magenta and aqua for magenta/cyan, so all six ANSI hues differ.
 * @param {RendererTokens} tokens
 * @returns {Record<string, string>}
 */
export function xtermTheme(tokens) {
  const dark = tokens.scheme === 'dark';
  return {
    background: tokens.bg,
    foreground: tokens.text,
    cursor: tokens.accent,
    cursorAccent: tokens.bg,
    selectionBackground: tokens.selection,
    black: dark ? tokens.textDim : tokens.text,
    brightBlack: dark ? tokens.textSoft : tokens.textDim,
    red: tokens.danger,
    brightRed: tokens.danger,
    green: tokens.success,
    brightGreen: tokens.success,
    yellow: tokens.warning,
    brightYellow: tokens.warning,
    blue: tokens.info,
    brightBlue: tokens.info,
    magenta: tokens.categoricalInk[4],
    brightMagenta: tokens.categoricalInk[4],
    cyan: tokens.categoricalInk[2],
    brightCyan: tokens.categoricalInk[2],
    white: tokens.textSoft,
    brightWhite: tokens.text,
  };
}
