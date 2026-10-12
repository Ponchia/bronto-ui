const LINK_TAG = /<link\b[^>]*>/gi;
const HREF = /\bhref=["']([^"']+)["']/i;

/** Find stylesheet recipes whose URLs cannot load the intended browser asset. */
export function stylesheetRecipeProblems(text, version) {
  const currentCdn = `cdn.jsdelivr.net/npm/@ponchia/ui@${version}/`;
  const problems = [];
  for (const match of text.matchAll(LINK_TAG)) {
    const tag = match[0];
    if (!/\brel=["']stylesheet["']/i.test(tag)) continue;
    const url = HREF.exec(tag)?.[1];
    if (!url) continue;
    let reason;
    if (/^@ponchia\/ui(?:[/@]|$)/.test(url)) {
      reason =
        'bare package specifier in a browser stylesheet link; use a CSS @import ' +
        'with a bundler, or a real URL to dist/bronto.css or dist/css/<leaf>.css';
    } else if (
      url.includes(currentCdn) &&
      !/\/dist\/(?:bronto\.css|css\/[a-z-]+\.css)$/.test(url)
    ) {
      reason =
        'browser stylesheet CDN recipes must point at built dist assets, ' +
        'e.g. dist/bronto.css or dist/css/report-kit.css';
    }
    if (reason) problems.push({ index: match.index, url, reason });
  }
  return problems;
}
