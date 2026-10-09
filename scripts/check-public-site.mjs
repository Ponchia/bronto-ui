/** Verify the *assembled* Pages artifact, not only files in the repo. */
import { mkdtemp, rm, readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname, extname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { components } from '../site/components.mjs';

const repo = resolve(import.meta.dirname, '..');
const temp = await mkdtemp(join(tmpdir(), 'brontoui-pages-check-'));
const built = join(temp, 'public');
const checked = new Set();
const required = [
  'index.html',
  'examples/index.html',
  'examples/operations/index.html',
  'examples/reports/index.html',
  'examples/theming/index.html',
  'components/index.html',
  'docs/index.html',
  'docs/getting-started/vanilla.html',
  'docs/getting-started/first-component.html',
  'docs/getting-started/upgrade.html',
  'docs/reporting.html',
  'docs/reference.html',
  'lab/index.html',
  'demo/index.html',
  'demo/first-steps.html',
  'demo/index.js',
  'glyphs/glyphs.js',
  'annotations/index.js',
  'connectors/index.js',
  'behaviors/index.js',
  'site/site.js',
  'site/site.css',
  'site/assets/operations.jpg',
  'site/assets/report.jpg',
  'site/assets/theming.jpg',
  'site/assets/social.jpg',
  'docs/search-index.json',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
];

async function checkModule(path) {
  if (checked.has(path)) return;
  checked.add(path);
  assert(existsSync(join(built, path)), `Unpublished JavaScript module: ${path}`);
  const src = await readFile(join(built, path), 'utf8');
  const pattern = /(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(src))) {
    if (!match[1].startsWith('.')) continue;
    let child = resolve(dirname(join(built, path)), match[1]);
    if (!extname(child)) child += '.js';
    const rel = relative(built, child).replaceAll('\\', '/');
    assert(!rel.startsWith('..'), `Unexpected module escaping published site: ${rel}`);
    await checkModule(rel);
  }
}
async function checkLocalResource(path, source) {
  if (/^(?:https?:|data:|mailto:|tel:|javascript:|#)/i.test(source)) return;
  const target = source.split(/[?#]/)[0];
  if (!target || target.startsWith('/')) return; // Origin-absolute URLs are intentionally not used for site navigation.
  const resolved = resolve(dirname(join(built, path)), decodeURIComponent(target));
  const suffix = relative(built, resolved).replaceAll('\\', '/');
  assert(!suffix.startsWith('..'), `Resource escapes Pages root in ${path}: ${source}`);
  if (suffix.endsWith('/') || (existsSync(resolved) && (await stat(resolved)).isDirectory())) {
    assert(existsSync(join(resolved, 'index.html')), `Missing index for ${path}: ${source}`);
  } else {
    assert(existsSync(resolved), `Broken HTML asset/link in ${path}: ${source}`);
  }
}
try {
  const build = spawnSync(process.execPath, ['scripts/build-public-site.mjs', built], {
    cwd: repo,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(build.status, 0, `site:build failed: ${build.stderr || build.stdout}`);
  for (const file of required)
    assert(existsSync(join(built, file)), `Pages output is missing ${file}`);

  for (const module of ['demo/index.js', 'demo/service.js', 'demo/discussion.js', 'site/site.js'])
    await checkModule(module);

  const pages = [
    'index.html',
    'examples/index.html',
    'components/index.html',
    'docs/index.html',
    'lab/index.html',
    'examples/operations/index.html',
    'examples/reports/index.html',
    'examples/theming/index.html',
    'docs/getting-started/vanilla.html',
    'docs/getting-started/first-component.html',
    'docs/getting-started/upgrade.html',
    'docs/reporting.html',
  ];
  for (const path of pages) {
    const html = await readFile(join(built, path), 'utf8');
    assert(html.includes('<main id="main"'), `Missing main landmark in ${path}`);
    assert(html.includes('name="description"'), `Missing description in ${path}`);
    assert(html.includes('rel="canonical"'), `Missing canonical in ${path}`);
    assert(
      !html.includes('{{root}}') && !html.includes('{{docsSidebar}}'),
      `Unrendered template in ${path}`,
    );
    const page = new JSDOM(html);
    for (const el of page.window.document.querySelectorAll('[href],[src]')) {
      await checkLocalResource(path, el.getAttribute('href') || el.getAttribute('src'));
    }
    page.window.close();
  }
  const catalog = await readFile(join(built, 'components/index.html'), 'utf8');
  assert(
    (catalog.match(/data-component-card/g) || []).length >= 12,
    'Component explorer unexpectedly small',
  );
  assert(catalog.includes('data-component-query'), 'Component search missing');
  // Curated copyable specimens must use classes present in the default CSS,
  // rather than silently relying on optional layers loaded by other demos.
  const bundledCSS = await readFile(join(built, 'dist/bronto.css'), 'utf8');
  for (const component of components) {
    const snippet = new JSDOM(component.markup);
    for (const node of snippet.window.document.querySelectorAll('[class]')) {
      for (const cls of node.classList) {
        if (cls.startsWith('ui-')) {
          assert(
            bundledCSS.includes('.' + cls),
            'Copyable component ' + component.name + ' references unbundled class ' + cls,
          );
        }
      }
    }
    snippet.window.close();
  }

  // Public copyable snippets need their own accessible navigation and table
  // names: the website cannot supply missing context after copy/paste.
  for (const component of components) {
    const snippet = new JSDOM(component.markup);
    for (const breadcrumb of snippet.window.document.querySelectorAll('.ui-breadcrumb')) {
      assert(
        breadcrumb.closest('nav[aria-label], nav[aria-labelledby]'),
        'Copyable component ' + component.name + ' has an unnamed breadcrumb navigation',
      );
    }
    for (const table of snippet.window.document.querySelectorAll('table')) {
      assert(
        table.querySelector('caption')?.textContent.trim() ||
          table.hasAttribute('aria-label') ||
          table.hasAttribute('aria-labelledby'),
        'Copyable component ' + component.name + ' contains an unnamed table',
      );
    }
    snippet.window.close();
  }

  for (const example of ['operations', 'reports', 'theming']) {
    const path = `examples/${example}/index.html`;
    const html = new JSDOM(await readFile(join(built, path), 'utf8'));
    const sourceLinks = [
      ...html.window.document.querySelectorAll(
        'a[href^="https://github.com/Ponchia/bronto-ui/blob/main/demo/"]',
      ),
    ];
    assert(sourceLinks.length >= 1, 'Example ' + example + ' must link to actual source');
    for (const link of sourceLinks) {
      const rel = link.href.split('/blob/main/')[1];
      assert(
        rel.startsWith('demo/') && !rel.includes('..') && existsSync(join(repo, rel)),
        'Example ' + example + ' has missing/unsafe source file ' + rel,
      );
    }
    const preview = html.window.document.querySelector('.example-mobile-preview');
    assert(
      preview?.querySelector('img[alt]') && preview.getAttribute('href')?.includes('demo/'),
      'Mobile example ' + example + ' requires a real screenshot linked to its interactive demo',
    );
    html.window.close();
  }
  const docs = JSON.parse(await readFile(join(built, 'docs/search-index.json'), 'utf8'));
  assert(docs.length >= 70, `Missing reference docs: ${docs.length}`);
  assert(
    docs.every((d) => existsSync(join(built, d.url))),
    'Search results point to unavailable docs',
  );
  // Verify the complete generated documentation link graph, not just the
  // homepage and one guide. Regression coverage for root Markdown links,
  // directory index pages and linked data assets.
  let verifiedDocLinks = 0;
  for (const doc of docs) {
    const html = await readFile(join(built, doc.url), 'utf8');
    const parsed = new JSDOM(html);
    const active = parsed.window.document.querySelector('.docs-sidebar a[aria-current="page"]');
    assert(active, 'Current documentation page is not identified in sidebar: ' + doc.url);
    const activeGroup = active.closest('details.docs-nav-group');
    assert(activeGroup?.open, 'Current documentation category is collapsed: ' + doc.url);
    for (const link of parsed.window.document.querySelectorAll('a[href]')) {
      await checkLocalResource(doc.url, link.getAttribute('href'));
      verifiedDocLinks += 1;
    }
    parsed.window.close();
  }
  for (const route of [
    'docs/adr/index.html',
    'docs/migrations/index.html',
    'shiki/nothing.json',
    'CONTRIBUTING.md',
  ]) {
    assert(existsSync(join(built, route)), 'Missing referenced artifact: ' + route);
  }
  assert(
    !existsSync(join(built, 'site/pages/home.html')),
    'Unrendered public-site templates must not be published',
  );
  assert(
    !existsSync(join(built, 'site/components.mjs')),
    'Authoring-only component metadata must not be published',
  );
  // A zero-JS first example must be served in the Pages artifact and use
  // only the default Bronto stylesheet, like an actual minimal consumer.
  const firstPage = new JSDOM(await readFile(join(built, 'demo/first-steps.html'), 'utf8'));
  assert(
    firstPage.window.document.querySelector('link[href="../dist/bronto.css"]'),
    'First example must load the shipped default CSS',
  );
  assert(
    firstPage.window.document.querySelector('main .ui-card .ui-badge--success'),
    'First example is missing its card and status',
  );
  assert(
    !firstPage.window.document.querySelector('script'),
    'First example must remain a no-JS HTML specimen',
  );
  for (const node of firstPage.window.document.querySelectorAll('[href],[src]'))
    await checkLocalResource(
      'demo/first-steps.html',
      node.getAttribute('href') || node.getAttribute('src'),
    );
  firstPage.window.close();
  const intro = new JSDOM(
    await readFile(join(built, 'docs/getting-started/first-component.html'), 'utf8'),
  );
  assert(
    intro.window.document.querySelector('.doc-prose pre code'),
    'First component walkthrough needs a copyable code sample',
  );
  intro.window.close();
  const sitemap = await readFile(join(built, 'sitemap.xml'), 'utf8');
  assert(
    sitemap.includes('docs/getting-started/vanilla.html'),
    'Static documentation missing from sitemap',
  );
  assert(sitemap.includes('examples/operations/'), 'Examples missing from sitemap');
  console.log(
    `✓ Public Pages: ${pages.length} critical HTML pages, ${checked.size} JS modules, ${docs.length} searchable docs, documentation links, component catalog and assets present`,
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
