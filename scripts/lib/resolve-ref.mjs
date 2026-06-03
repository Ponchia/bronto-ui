// Shared token-reference resolver for the three foreign-renderer generators
// (gen-d2 / gen-mermaid / gen-vega). Each emits resolved-hex theme maps because
// the foreign renderer bakes colours into a frozen scene and cannot read
// `var(--x)`; this turns a `var(--token)` reference into the per-theme resolved
// value (or passes a literal — a font stack, an already-resolved colour —
// through), throwing if a referenced token has no resolved value. One copy so a
// fix lands in all three at once. (code-quality audit Q3.)
import { buildResolved } from '../gen-resolved.mjs';

const VAR = /^var\(\s*(--[\w-]+)\s*\)$/;

/**
 * Build a `resolveRef(ref, theme)` bound to a single resolved-token snapshot.
 * @param {string} label generator name, used in the throw message (e.g. 'gen-d2').
 * @returns {(ref: string, theme: string) => string}
 */
export function makeResolveRef(label) {
  const resolved = buildResolved();
  return function resolveRef(ref, theme) {
    const m = VAR.exec(ref);
    if (!m) return ref; // literal: font stack, or an already-resolved colour
    const v = resolved[theme]?.[m[1]];
    if (!v) throw new Error(`${label}: ${m[1]} has no resolved value in ${theme}`);
    return v;
  };
}
