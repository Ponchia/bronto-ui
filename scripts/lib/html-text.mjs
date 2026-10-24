// For HTML text and double-quoted attributes only. This does not validate URLs,
// CSS, script text, or trusted markup. Encode ampersands first to keep entities
// and repeated delimiters literal; apostrophes cannot close a double quote.
export const escapeHtmlText = (text) =>
  String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
