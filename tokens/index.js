/**
 * @ponchia/ui — design tokens as data.
 *
 * For consumers that need token values in JS rather than CSS: charting,
 * canvas, inline styles, theme-aware logic, Style Dictionary / Figma sync.
 *
 * `cssVars` is the canonical, exact mirror of the :root blocks in
 * css/tokens.css — keyed by the real custom-property name, values are
 * the verbatim CSS strings. scripts/check-tokens.mjs fails CI if this
 * drifts from the stylesheet, so the two cannot silently diverge.
 *
 * `tokens` is an ergonomic view derived programmatically from `cssVars`
 * (no second hand-maintained copy, so nothing to keep in sync).
 */

/** Exact mirror of css/tokens.css. Do not reshape — the sync check is literal. */
export const cssVars = {
  // Global :root — scales, shared with both themes.
  global: {
    '--radius-xl': '4px',
    '--radius-lg': '3px',
    '--radius-md': '2px',
    '--radius-sm': '1px',
    '--radius-pill': '999px',
    '--space-2xs': '0.25rem',
    '--space-xs': '0.5rem',
    '--space-sm': '0.75rem',
    '--space-md': '1rem',
    '--space-lg': '1.35rem',
    '--space-xl': '1.75rem',
    '--space-2xl': '2.5rem',
    '--mono': "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', ui-monospace, monospace",
    '--sans':
      "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    '--display': "'Doto', var(--mono)",
    '--dot-font': "'Doto', var(--mono)",
    '--text-2xs': '0.68rem',
    '--text-xs': '0.76rem',
    '--text-sm': '0.86rem',
    '--text-base': '0.95rem',
    '--text-lg': '1.15rem',
    '--text-xl': '1.45rem',
    '--tracking-wide': '0.14em',
    '--tracking-wider': '0.22em',
    '--ease-standard': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    '--ease-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
    '--ease-out': 'cubic-bezier(0.33, 1, 0.68, 1)',
    '--duration-fast': '130ms',
    '--duration-base': '200ms',
    '--duration-slow': '360ms',
    '--dot-size': '2px',
    '--dot-gap': '14px',
    '--z-base': '0',
    '--z-raised': '10',
    '--z-sticky': '20',
    '--z-overlay': '30',
    '--z-popover': '50',
    '--z-toast': '60',
    '--accent-1': 'color-mix(in srgb, var(--accent) 8%, var(--bg))',
    '--accent-2': 'color-mix(in srgb, var(--accent) 16%, var(--bg))',
    '--accent-3': 'color-mix(in srgb, var(--accent) 32%, var(--bg))',
    '--accent-4': 'color-mix(in srgb, var(--accent) 60%, var(--bg))',
    '--accent-5': 'var(--accent)',
    '--accent-6': 'var(--accent-strong)',
    '--surface-1': 'var(--bg)',
    '--surface-2': 'var(--bg-elevated)',
    '--surface-3': 'var(--panel)',
    '--surface-4': 'var(--panel-soft)',
    '--surface-5': 'var(--line)',
    '--surface-6': 'var(--line-strong)',
    '--bronto-color-bg': 'var(--bg)',
    '--bronto-color-surface': 'var(--panel)',
    '--bronto-color-surface-raised': 'var(--panel-strong)',
    '--bronto-color-border': 'var(--line)',
    '--bronto-color-border-strong': 'var(--line-strong)',
    '--bronto-color-text': 'var(--text)',
    '--bronto-color-text-muted': 'var(--text-dim)',
    '--bronto-color-action': 'var(--accent)',
    '--bronto-color-on-action': 'var(--button-text)',
    '--bronto-color-focus': 'var(--focus-ring)',
    '--bronto-color-success': 'var(--success)',
    '--bronto-color-warning': 'var(--warning)',
    '--bronto-color-danger': 'var(--danger)',
    '--bronto-color-info': 'var(--info)',
    '--surface': 'var(--panel)',
    '--surface-raised': 'var(--panel-strong)',
    '--surface-muted': 'var(--panel-soft)',
    '--border': 'var(--line)',
    '--border-strong': 'var(--line-strong)',
  },
  // Light palette — :root, :root[data-theme='light'].
  light: {
    '--bg': '#f4f4f2',
    '--bg-elevated': '#fbfbfa',
    '--bg-accent': 'color-mix(in srgb, var(--accent) 6%, transparent)',
    '--panel': '#ffffff',
    '--panel-strong': '#ffffff',
    '--panel-soft': '#ececea',
    '--line': '#d8d8d4',
    '--line-strong': '#a8a8a2',
    '--text': '#0a0a0a',
    '--text-soft': '#353533',
    '--text-dim': '#686863',
    '--accent': '#d71921',
    '--accent-strong': 'color-mix(in srgb, var(--accent) 83%, #000)',
    '--accent-text': 'var(--accent-strong)',
    '--accent-soft': 'color-mix(in srgb, var(--accent) 10%, transparent)',
    '--success': '#2f7d4f',
    '--success-soft': 'rgb(47, 125, 79, 0.12)',
    '--warning': '#806414',
    '--warning-soft': 'rgb(128, 100, 20, 0.13)',
    '--orange': '#a85f32',
    '--orange-soft': 'rgb(168, 95, 50, 0.13)',
    '--danger': '#c01622',
    '--danger-soft': 'rgb(192, 22, 34, 0.1)',
    '--info': '#1f63c4',
    '--info-soft': 'rgb(31, 99, 196, 0.12)',
    '--code-bg': 'rgb(10, 10, 10, 0.05)',
    '--button-text': '#ffffff',
    '--field-dot': 'rgb(10, 10, 10, 0.16)',
    '--field-dot-hot': 'rgb(10, 10, 10, 0.4)',
    '--field-dot-accent': 'color-mix(in srgb, var(--accent) 78%, transparent)',
    '--focus-ring': 'var(--accent)',
    '--shadow': 'none',
    '--shadow-raised': '0 0 0 1px var(--line-strong)',
  },
  // Dark palette — both the prefers-color-scheme and [data-theme='dark'] blocks.
  dark: {
    '--bg': '#000000',
    '--bg-elevated': '#0a0a0a',
    '--bg-accent': 'color-mix(in srgb, var(--accent) 8%, transparent)',
    '--panel': '#0c0c0c',
    '--panel-strong': '#141414',
    '--panel-soft': '#1a1a1a',
    '--line': '#2a2a2a',
    '--line-strong': '#444444',
    '--text': '#f2f2f2',
    '--text-soft': '#c4c4c4',
    '--text-dim': '#858585',
    '--accent': '#ff3b41',
    '--accent-strong': 'color-mix(in srgb, var(--accent) 84%, #fff)',
    '--accent-text': 'var(--accent-strong)',
    '--accent-soft': 'color-mix(in srgb, var(--accent) 14%, transparent)',
    '--success': '#4ec27e',
    '--success-soft': 'rgb(78, 194, 126, 0.14)',
    '--warning': '#d8bd72',
    '--warning-soft': 'rgb(216, 189, 114, 0.14)',
    '--orange': '#d08c5b',
    '--orange-soft': 'rgb(208, 140, 91, 0.15)',
    '--danger': '#ff4d54',
    '--danger-soft': 'rgb(255, 77, 84, 0.15)',
    '--info': '#6fb0e6',
    '--info-soft': 'rgb(111, 176, 230, 0.14)',
    '--code-bg': 'rgb(255, 255, 255, 0.05)',
    '--button-text': '#000000',
    '--field-dot': 'rgb(242, 242, 242, 0.14)',
    '--field-dot-hot': 'rgb(242, 242, 242, 0.36)',
    '--field-dot-accent': 'color-mix(in srgb, var(--accent) 82%, transparent)',
    '--focus-ring': 'var(--accent)',
    '--shadow': 'none',
    '--shadow-raised': '0 0 0 1px var(--line-strong)',
  },
};

const strip = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.replace(/^--/, ''), v]));

/** Ergonomic view, derived from cssVars (single source — never edit directly). */
export const tokens = {
  scale: strip(cssVars.global),
  color: { light: strip(cssVars.light), dark: strip(cssVars.dark) },
};

/** Resolve the palette for a theme: themeColor('dark').accent === '#ff3b41'. */
export function themeColor(theme = 'light') {
  return tokens.color[theme === 'dark' ? 'dark' : 'light'];
}

export default tokens;
