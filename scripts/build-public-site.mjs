/**
 * BrontoUI public website. All routes are generated into a static directory:
 * no client framework, hosting dependency, server, or runtime package additions.
 * The existing demo and Markdown sources remain the canonical fixtures.
 */
import { readFile, readdir, mkdir, cp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative, sep } from 'node:path';
import { Marked } from 'marked';
import { headingSlug } from './lib/doc-anchors.mjs';
import { publicDocHref } from './lib/doc-links.mjs';
import { prepareSiteOutput } from './lib/site-output.mjs';
import { components } from '../site/components.mjs';
import { examples } from '../site/examples.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.argv[2] || join(repo, '_site'));
const canonicalBase = (
  process.env.BRONTO_SITE_URL || 'https://ponchia.github.io/bronto-ui'
).replace(/\/$/, '');
const url = (path) => `${canonicalBase}/${path}`;
const esc = (text) =>
  String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const slash = (p) => p.split(sep).join('/');
const prefix = (outFile) => '../'.repeat(slash(outFile).split('/').length - 1) || './';
const files = [
  [
    'index.html',
    'home',
    'Bronto UI — CSS-first UI for tools and reports',
    'Framework-agnostic, accessible CSS for developer tools, operational dashboards and evidence-rich reports. Zero runtime dependencies.',
  ],
  [
    'examples/index.html',
    'examples',
    'Examples — Bronto UI',
    'See Bronto UI in complete operational dashboards, static reports, and theme explorations.',
  ],
  [
    'components/index.html',
    'components',
    'Components — Bronto UI',
    'Browse practical, copyable HTML patterns built from Bronto UI’s CSS-first component system.',
  ],
  [
    'docs/index.html',
    'docs',
    'Documentation — Bronto UI',
    'Get started with Bronto UI and explore its themed CSS, interactions, framework guides, and report primitives.',
  ],
  [
    'lab/index.html',
    'lab',
    'Laboratory — Bronto UI',
    'Complete specimen fixtures and advanced experiments behind the Bronto UI component system.',
  ],
];

const categoryFor = (path) => {
  if (
    path.startsWith('getting-started/') ||
    path.startsWith('interop/') ||
    ['integration', 'concepts', 'usage', 'compositions'].includes(path)
  )
    return 'Getting started';
  if (
    ['theming', 'contrast', 'stability', 'state', 'workbench', 'command', 'generated'].includes(
      path,
    )
  )
    return 'Interfaces & theming';
  if (
    [
      'reporting',
      'figure',
      'discussion',
      'annotations',
      'legends',
      'mermaid',
      'd2',
      'vega',
      'marks',
      'dots',
      'glyphs',
      'sources',
      'interval',
      'clamp',
      'highlights',
      'diff',
      'code',
      'spark',
      'sidenote',
      'textref',
      'bullet',
      'term',
      'toc',
      'tree',
      'connectors',
      'renderer',
      'spotlight',
      'crosshair',
      'selection',
    ].includes(path)
  )
    return 'Reports & data';
  return 'Reference & maintenance';
};
const groupsOrder = [
  'Getting started',
  'Interfaces & theming',
  'Reports & data',
  'Reference & maintenance',
];
const primaryDoc = [
  'getting-started/first-component',
  'getting-started/vanilla',
  'getting-started/upgrade',
  'concepts',
  'usage',
  'theming',
  'reporting',
  'reference',
];
const docs = [];

async function walk(base, path = '') {
  const entries = (await readdir(join(base, path), { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const ent of entries) {
    const part = join(path, ent.name);
    if (ent.isDirectory()) await walk(base, part);
    else if (ent.name.endsWith('.md')) {
      const markdown = await readFile(join(base, part), 'utf8');
      const stem = slash(part).replace(/\.md$/, '');
      const m = markdown.match(/^#\s+(.+)$/m);
      const title = (m ? m[1] : ent.name.replace(/\.md$/, '')).replace(/[*`]/g, '').trim();
      docs.push({
        stem,
        title,
        category: categoryFor(stem),
        markdown,
        excerpt: markdown
          .replace(/<!--[\s\S]*?-->/g, ' ')
          .replace(/```[\s\S]*?```/g, ' ')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/[#*_`>\[\]()]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 240),
      });
    }
  }
}
await walk(join(repo, 'docs'));
docs.sort((a, b) => {
  const ga = groupsOrder.indexOf(a.category) - groupsOrder.indexOf(b.category);
  if (ga) return ga;
  return primaryDoc.indexOf(a.stem) >= 0 && primaryDoc.indexOf(b.stem) < 0
    ? -1
    : primaryDoc.indexOf(a.stem) < 0 && primaryDoc.indexOf(b.stem) >= 0
      ? 1
      : a.title.localeCompare(b.title);
});
const nav = (current, p) => {
  const items = [
    ['Overview', '', 'home'],
    ['Examples', 'examples/', 'examples'],
    ['Components', 'components/', 'components'],
    ['Docs', 'docs/', 'docs'],
  ];
  return `<nav class="site-nav" id="site-nav" aria-label="Main navigation">
  ${items.map(([label, path, id]) => `<a ${current === id ? 'aria-current="page"' : ''} href="${p}${path}">${label}</a>`).join('\n')}
  <a class="site-nav__lab" ${current === 'lab' ? 'aria-current="page"' : ''} href="${p}lab/">Lab</a>
  </nav>`;
};
const sharedHeader = (current, p) => `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="site-header__inner">
    <a class="wordmark" href="${p}" aria-label="Bronto UI homepage"><span class="wordmark__symbol" aria-hidden="true">B<span>·</span></span><span>bronto<span class="wordmark__ui">ui</span></span></a>
    ${nav(current, p)}
    <div class="header-actions">
      <button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="false" data-theme-toggle hidden><span aria-hidden="true">◐</span></button>
      <a class="header-github" href="https://github.com/Ponchia/bronto-ui" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a>
      <button class="menu-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="site-nav" data-menu-toggle type="button" hidden>Menu <span aria-hidden="true">☰</span></button>
    </div>
  </div>
</header>`;
const sharedFooter = (p) => `<footer class="site-footer"><div class="site-footer__inner">
  <div><a class="footer-mark" href="${p}">bronto<span>ui</span>.</a><p>Interfaces for work that needs to be understood.</p></div>
  <div class="footer-links"><a href="${p}examples/">Examples</a><a href="${p}components/">Components</a><a href="${p}docs/">Docs</a><a href="${p}lab/">Lab</a></div>
  <div class="footer-links"><a href="https://github.com/Ponchia/bronto-ui">GitHub ↗</a><a href="https://www.npmjs.com/package/@ponchia/ui">npm ↗</a><a href="https://ponchia.github.io/bronto-annotations/">Annotation engine ↗</a><a href="https://brontolotto.observer/projects/bronto-ui/">About the project ↗</a></div>
  <div class="footer-bottom"><span>MIT licensed · Created by <a href="https://brontolotto.observer/">Zeno Trevisan</a></span><span>Static HTML · Bronto UI CSS · No framework runtime</span></div>
</div></footer>`;
const rendered = (outFile, current, title, description, inner) => {
  const p = prefix(outFile);
  const canonical = url(outFile.replace(/index\.html$/, ''));
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <script>
    try {
      const theme = localStorage.getItem('bronto-ui-site-theme');
      if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
    } catch {}
  </script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${url('site/assets/social.jpg')}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" type="image/svg+xml" href="${p}site/favicon.svg" />
  <link rel="stylesheet" href="${p}dist/bronto.css" />
  <link rel="stylesheet" href="${p}site/site.css" />
  <script type="module" src="${p}site/site.js"></script>
</head>
<body data-site-root="${p}">
${sharedHeader(current, p)}
<main id="main" class="page-main">
${inner}
</main>
${sharedFooter(p)}
</body></html>\n`;
};
const docLink = (stem, p, label) => `<a href="${p}docs/${stem}.html">${esc(label)}</a>`;
const docsSidebar = (current, p) => {
  const activeCategory = docs.find((doc) => doc.stem === current)?.category;
  return `<aside class="docs-sidebar" id="docs-navigation" aria-label="Documentation contents">
  <div class="docs-sidebar__top"><h2 class="docs-sidebar__title">Browse documentation</h2><a href="${p}docs/">Index ↗</a></div>
  <label class="search-box" hidden><span class="visually-hidden">Search documentation</span><span aria-hidden="true">⌕</span><input type="search" placeholder="Search all documentation" autocomplete="off" data-doc-search /></label>
  <div class="doc-search-results" data-doc-results aria-live="polite" hidden></div>
  <div data-doc-groups>${groupsOrder
    .map((group) => {
      const entries = docs.filter((d) => d.category === group);
      return `<details class="docs-nav-group" ${activeCategory === group || (current === 'index' && group === groupsOrder[0]) ? 'open' : ''}><summary>${esc(group)} <span>${entries.length}</span></summary>
    <div class="docs-nav-links">${entries.map((d) => `<a href="${p}docs/${d.stem}.html" ${d.stem === current ? 'aria-current="page"' : ''}>${esc(d.title)}</a>`).join('')}</div></details>`;
    })
    .join('')}</div>
</aside>`;
};
const categories = ['All', ...new Set(components.map((c) => c.category))];
const componentCard = (
  c,
  p,
) => `<article class="component-card" data-component-card data-category="${esc(c.category)}" data-search="${esc((c.name + ' ' + c.category + ' ' + c.summary).toLowerCase())}">
 <div class="component-card__head"><p class="kicker">${esc(c.category.toUpperCase())}</p><h2>${esc(c.name)}</h2><p>${esc(c.summary)}</p></div>
 <div class="component-preview">${c.markup}</div>
 <div class="component-code"><div class="component-code__bar"><span>HTML / CSS</span><button class="copy-button" data-copy type="button" hidden>Copy markup</button></div><pre tabindex="0"><code>${esc(c.markup)}</code></pre></div>
 <a class="component-more" href="${p}docs/${c.doc}.html">Read usage guide ↗</a>
 </article>`;
const pageSource = async (filename, p) =>
  (await readFile(join(repo, 'site/pages', filename), 'utf8'))
    .replaceAll('{{root}}', p)
    .replaceAll('{{examples}}', examples.map((ex) => exampleCard(ex, p)).join('\n'))
    .replaceAll('{{components}}', components.map((c) => componentCard(c, p)).join('\n'))
    .replaceAll(
      '{{componentChips}}',
      categories
        .map(
          (c, i) =>
            `<button class="catalog-chip" type="button" data-component-chip="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`,
        )
        .join(''),
    );

const exampleCard = (ex, p) => `<article class="example-card">
<a class="example-card__image" href="${p}examples/${ex.key}/"><img src="${p}site/assets/${ex.image}" alt="${esc(ex.name)} example" loading="lazy" width="1200" height="720" /></a>
<div class="example-card__body"><span class="kicker">${ex.eyebrow}</span><h3><a href="${p}examples/${ex.key}/">${esc(ex.name)} <span aria-hidden="true">↗</span></a></h3><p>${esc(ex.desc)}</p></div>
</article>`;
const sourceUrl = (file) => 'https://github.com/Ponchia/bronto-ui/blob/main/' + file;
const renderSourceSection = (ex) =>
  '<section class="example-source" aria-label="Example implementation">' +
  '<div><p class="kicker">READ THE SOURCE</p><h2>Reuse the pattern, not the sample data.</h2></div>' +
  '<div><p>' +
  esc(ex.implementation) +
  '</p><ul>' +
  ex.source
    .map(
      (file) =>
        '<li><a href="' +
        sourceUrl(file) +
        '" target="_blank" rel="noopener">' +
        esc(file) +
        ' ↗</a></li>',
    )
    .join('') +
  '</ul><p>Use the <a href="https://github.com/Ponchia/bronto-ui/tree/main/examples/vanilla-vite">packed Vanilla Vite starter</a> for a runnable npm-based project.</p></div>' +
  '</section>';
const renderExample = (ex, p) => `<section class="page-container example-detail">
  <a class="back-link" href="${p}examples/">← All examples</a>
  <div class="page-intro"><p class="kicker">${ex.eyebrow} / EXAMPLE</p><h1>${esc(ex.name)}</h1><p class="page-lede">${esc(ex.story)}</p></div>
  <div class="example-controls"><span class="specimen-pill"><span class="signal" aria-hidden="true"></span> Live specimen</span>
    <a class="button button--primary" href="${p}demo/${ex.demo}" target="_blank" rel="noopener">Open full demo ↗</a>
    <a class="button button--outline" href="${p}docs/${ex.docs}">Read related docs ↗</a>
    <a class="button button--outline" href="${sourceUrl(ex.source[0])}"
       target="_blank" rel="noopener">View HTML source ↗</a>
  </div>
  <div class="iframe-frame"><div class="frame-chrome"><span aria-hidden="true">● ● ●</span><span>${ex.key}.bronto-ui.demo</span><span>HTML + CSS</span></div>
  <iframe title="${esc(ex.name)} interactive preview" loading="lazy" src="${p}demo/${ex.demo}"></iframe>
  <a class="example-mobile-preview" href="${p}demo/${ex.demo}" target="_blank" rel="noopener">
    <img src="${p}site/assets/${ex.image}" alt="${esc(ex.name)} screenshot preview" width="1200" height="720" />
    <span>Open the interactive ${esc(ex.name)} example <span aria-hidden="true">↗</span></span>
  </a></div>
  <div class="example-notes"><h2>${esc(ex.accent)}</h2><p>${esc(ex.desc)}</p>
  <ul class="tech-list">${ex.tech.map((v) => `<li>${esc(v)}</li>`).join('')}</ul></div>
  ${renderSourceSection(ex)}
</section>`;
await prepareSiteOutput(repo, output);
for (const folder of [
  'demo',
  'docs',
  'css',
  'dist',
  'fonts',
  'tokens',
  'classes',
  'behaviors',
  'glyphs',
  'annotations',
  'connectors',
  'renderer',
  'shiki',
]) {
  await cp(join(repo, folder), join(output, folder), { recursive: true });
}
// Publish only the compiled public shell. Hand-authored page templates and
// component source definitions belong in Git, not at public raw HTML URLs.
await mkdir(join(output, 'site'), { recursive: true });
for (const file of ['site.css', 'site.js', 'favicon.svg']) {
  await cp(join(repo, 'site', file), join(output, 'site', file));
}
await cp(join(repo, 'site/assets'), join(output, 'site/assets'), { recursive: true });
await cp(join(repo, 'llms.txt'), join(output, 'llms.txt'));
for (const file of [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'MIGRATIONS.json',
  'ROADMAP.md',
  'LICENSE',
]) {
  await cp(join(repo, file), join(output, file));
}
for (const [outFile, id, title, desc] of files) {
  const p = prefix(outFile);
  let html = await pageSource(`${id}.html`, p);
  if (id === 'docs') html = html.replace('{{docsSidebar}}', docsSidebar('index', p));
  const target = join(output, outFile);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, rendered(outFile, id, title, desc, html));
}
for (const ex of examples) {
  const outFile = `examples/${ex.key}/index.html`;
  const p = prefix(outFile);
  const target = join(output, outFile);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(
    target,
    rendered(outFile, 'examples', `${ex.name} — Bronto UI`, ex.desc, renderExample(ex, p)),
  );
}
for (const doc of docs) {
  const seenHeadings = new Set();
  const markdown = new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      heading({ text, tokens, depth }) {
        const id = headingSlug(text, seenHeadings);
        return `<h${depth} id="${esc(id)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
    },
  });
  const outFile = `docs/${doc.stem}.html`;
  const p = prefix(outFile);
  const renderedMd = markdown
    .parse(doc.markdown)
    // Some code fences scroll horizontally on narrow screens. Make them
    // independently keyboard-focusable so all of their text remains reachable.
    .replace(/<pre>/g, '<pre tabindex="0">')
    .replace(
      /href="([^"]+)"/g,
      (_full, href) => 'href="' + publicDocHref('docs/' + doc.stem + '.md', href) + '"',
    )
    .replace(
      /href="\.\.\/\.\.\/examples\/([^"]+)"/g,
      (_full, example) =>
        'href="https://github.com/Ponchia/bronto-ui/tree/main/examples/' + example + '"',
    );
  const contents = `<div class="docs-layout page-container">
    ${docsSidebar(doc.stem, p)}
    <div class="docs-article-wrap">
      <div class="doc-breadcrumb"><a href="${p}docs/">Docs</a> <span aria-hidden="true">/</span> ${esc(doc.category)}</div>
      <article class="doc-prose" data-doc-body>${renderedMd}</article>
      <nav class="doc-bottom-nav" aria-label="Related documentation">
        <a href="${p}docs/">← Documentation index</a>
        <a href="#docs-navigation">Browse all docs ↓</a>
        <a href="${p}components/">Component catalog ↗</a>
        <a href="https://github.com/Ponchia/bronto-ui/blob/main/docs/${doc.stem}.md">View Markdown source ↗</a>
      </nav>
    </div></div>`;
  const target = join(output, outFile);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(
    target,
    rendered(
      outFile,
      'docs',
      `${doc.title} — Bronto UI documentation`,
      `Documentation for ${doc.title} in Bronto UI: patterns, usage notes, examples, and technical details.`,
      contents,
    ),
  );
}
// Authored Markdown links to these documentation directories should have
// usable index pages instead of returning a GitHub Pages 404.
for (const [folder, title] of [
  ['adr', 'Architecture decisions'],
  ['migrations', 'Migration guides'],
]) {
  const entries = docs.filter((doc) => doc.stem.startsWith(folder + '/'));
  const file = 'docs/' + folder + '/index.html';
  const p = prefix(file);
  const content =
    '<section class="page-container section-intro"><p class="kicker">DOCUMENTATION / REFERENCE</p><h1>' +
    esc(title) +
    '</h1><p class="page-lede">Browse the reference documents individually.</p></section>' +
    '<section class="page-container lab-grid">' +
    entries
      .map(
        (doc) =>
          '<a class="lab-card" href="' +
          p +
          'docs/' +
          doc.stem +
          '.html"><span class="kicker">BRONTO UI</span><h2>' +
          esc(doc.title) +
          '</h2><p>' +
          esc(doc.excerpt.slice(0, 140)) +
          '</p><span class="text-link">Read document ↗</span></a>',
      )
      .join('') +
    '</section>';
  const target = join(output, file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(
    target,
    rendered(file, 'docs', title + ' — Bronto UI', title + ' for Bronto UI.', content),
  );
}
await writeFile(
  join(output, 'docs/search-index.json'),
  JSON.stringify(
    docs.map((d) => ({
      title: d.title,
      category: d.category,
      url: `docs/${d.stem}.html`,
      description: d.excerpt.slice(0, 140),
      content: d.markdown.replace(/\s+/g, ' '),
    })),
  ),
);
const sitemap = [
  'docs/adr/',
  'docs/migrations/',
  ...files.map(([path]) => path.replace(/index\.html$/, '')),
  ...examples.map((ex) => `examples/${ex.key}/`),
  ...docs.map((d) => `docs/${d.stem}.html`),
];
await writeFile(
  join(output, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((path) => `<url><loc>${esc(url(path))}</loc></url>`).join('\n')}
</urlset>\n`,
);
await writeFile(
  join(output, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${url('sitemap.xml')}\n`,
);
console.log(
  `Bronto UI public site: ${sitemap.length} indexable pages; ${docs.length} documentation pages, ${examples.length} curated examples, destination ${relative(repo, output) || output}`,
);
