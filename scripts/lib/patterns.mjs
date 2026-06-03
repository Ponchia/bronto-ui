// Shared regexes for the gates. Kept here so the three foreign-renderer theme
// gates (check-d2/mermaid/vega) validate "is this a real resolved colour" with
// one definition — a fix (e.g. a new colour syntax) then lands in all three at
// once instead of drifting. (code-quality audit Q9.)

/** A fully-resolved CSS colour: hex (3–8 digits) or rgb()/rgba(). No var(). */
export const CSS_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\))$/i;
