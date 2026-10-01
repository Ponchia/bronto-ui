/**
 * Parse a resolved CSS colour to sRGB, gamut-clipped: hex, `rgb()`, `hsl()`,
 * `oklch()`, `oklab()`, `lab()`, `lch()`, `color(srgb | srgb-linear |
 * display-p3 | xyz | xyz-d65 | xyz-d50 …)` and `transparent`. Anything else —
 * `var()`, `color-mix()`, `light-dark()`, a named colour — returns null; use
 * `resolveColor()` to have the browser compute it first.
 * @param {string} value
 * @returns {Rgba | null}
 */
export function parseColor(value: string): Rgba | null;
/**
 * Serialize for a renderer: `#rrggbb` when opaque, `rgba(r, g, b, a)` when
 * not — the two forms canvas, SVG, d3-color, xterm, three.js and MapLibre
 * all accept.
 * @param {Rgba} color
 */
export function formatColor({ r, g, b, alpha }: Rgba): string;
/**
 * Resolve any CSS colour expression to a renderer literal, using the browser
 * for what `parseColor()` cannot compute (`var()`, `color-mix()`,
 * `light-dark()`, named colours). Returns null for an invalid colour or when no
 * document is available.
 * @param {string} value
 * @param {{ element?: Element }} [options] Context for `var()` and `light-dark()`.
 */
export function resolveColor(value: string, options?: {
    element?: Element;
}): string | null;
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
export function readTokens(element?: Element, options?: {
    scheme?: "light" | "dark";
}): RendererTokens;
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
export function observeTokens(callback: (tokens: RendererTokens) => void, options?: {
    element?: Element;
    signal?: AbortSignal;
}): () => void;
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
export function vegaConfig(tokens: RendererTokens, options?: {
    mode?: "vega-lite" | "vega";
    narrow?: boolean;
    background?: string;
}): Record<string, any>;
/**
 * An xterm.js `ITheme` from resolved tokens: page ink on the page background,
 * the accent as the cursor, status colours for red/green/yellow/blue and the
 * categorical magenta and aqua for magenta/cyan, so all six ANSI hues differ.
 * @param {RendererTokens} tokens
 * @returns {Record<string, string>}
 */
export function xtermTheme(tokens: RendererTokens): Record<string, string>;
/**
 * A colour as sRGB channels (0–255) and alpha (0–1).
 */
export type Rgba = {
    r: number;
    g: number;
    b: number;
    alpha: number;
};
/**
 * The bronto roles a renderer draws with, resolved to literals: opaque colours
 * as `#rrggbb`, translucent ones as `rgba(r, g, b, a)`.
 */
export type RendererTokens = {
    /**
     * The resolved scheme of the page background.
     */
    scheme: "light" | "dark";
    /**
     * Page background (`--bg`).
     */
    bg: string;
    /**
     * A lifted page background (`--bg-elevated`).
     */
    bgElevated: string;
    /**
     * The surface a renderer usually draws on (`--panel`).
     */
    panel: string;
    /**
     * A raised surface (`--panel-strong`).
     */
    panelStrong: string;
    /**
     * Primary ink (`--text`).
     */
    text: string;
    /**
     * Secondary ink (`--text-soft`).
     */
    textSoft: string;
    /**
     * Tertiary ink (`--text-dim`).
     */
    textDim: string;
    /**
     * Hairline and grid (`--line`).
     */
    line: string;
    /**
     * Axis, domain and rule (`--line-strong`).
     */
    lineStrong: string;
    /**
     * The one accent (`--accent`).
     */
    accent: string;
    /**
     * Accent as text on the page (`--accent-text`).
     */
    accentText: string;
    /**
     * Ink on an accent fill (`--on-accent`).
     */
    onAccent: string;
    /**
     * Focus ring (`--focus-ring`).
     */
    focus: string;
    /**
     * A translucent selection wash over `panel`.
     */
    selection: string;
    /**
     * Status: success.
     */
    success: string;
    /**
     * Status: warning.
     */
    warning: string;
    /**
     * Status: danger.
     */
    danger: string;
    /**
     * Status: info.
     */
    info: string;
    /**
     * The sans font stack.
     */
    sans: string;
    /**
     * The monospace font stack.
     */
    mono: string;
    /**
     * Eight categorical hues, fixed order.
     */
    categorical: string[];
    /**
     * Each hue's wash over `panel`.
     */
    categoricalTint: string[];
    /**
     * Each hue as text on `panel` and its tint.
     */
    categoricalInk: string[];
    /**
     * One-hue ramp; step 1 nearest the surface.
     */
    sequential: string[];
    /**
     * Negative … neutral … positive ramp.
     */
    diverging: string[];
};
//# sourceMappingURL=index.d.ts.map