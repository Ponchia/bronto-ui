// Shared regexes for the gates. Kept here so the three foreign-renderer theme
// gates (check-d2/mermaid/vega) validate "is this a real resolved colour" with
// one definition — a fix (e.g. a new colour syntax) then lands in all three at
// once instead of drifting. (code-quality audit Q9.)

/** A fully-resolved CSS colour: hex (3–8 digits) or rgb()/rgba(). No var(). */
export const CSS_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\))$/i;

/**
 * Strip `/* … *​/` block comments from a CSS source string. The bundler
 * (build-dist minify) and every gate that SCRAPES CSS rather than diffing a
 * generator (check-classes/legend/contract/color-policy) share this: a class or
 * token named only inside a comment must NOT satisfy the contract, or a deleted
 * rule whose name lingers in prose would keep a gate green. One definition so
 * the strip can never drift between them. (code-quality audit Q9.)
 */
export const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
