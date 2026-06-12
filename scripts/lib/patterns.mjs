// Shared regexes for the gates. Kept here so the three foreign-renderer theme
// gates (check-d2/mermaid/vega) validate "is this a real resolved colour" with
// one definition — a fix (e.g. a new colour syntax) then lands in all three at
// once instead of drifting. (code-quality audit Q9.)

/** A fully-resolved CSS colour: hex (3–8 digits) or rgb()/rgba(). No var(). */
export const CSS_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\))$/i;

// CSS @import parser shared by build and integrity gates. Supports both
// `@import url('./x.css') layer(...)`, `@import url(./x.css) layer(...)`, and
// `@import './x.css' layer(...)`.
const CSS_IMPORT =
  /@import\s+(?:url\(\s*(?:(['"])([^'")]+)\1|([^'")\s]+))\s*\)|(['"])([^'")]+)\4)[^;]*;/g;

export const cssImports = (css) => [...css.matchAll(CSS_IMPORT)].map((m) => m[2] ?? m[3] ?? m[5]);

/**
 * Strip `/* … *​/` block comments from a CSS source string. The bundler
 * (build-dist minify) and every gate that SCRAPES CSS rather than diffing a
 * generator (check-classes/legend/contract/color-policy) share this: a class or
 * token named only inside a comment must NOT satisfy the contract, or a deleted
 * rule whose name lingers in prose would keep a gate green. One definition so
 * the strip can never drift between them. (code-quality audit Q9.)
 */
export const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
