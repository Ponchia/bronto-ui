// Progressive enhancements only: this site remains navigable with JavaScript off.
const root = document.body.dataset.siteRoot || './';
const html = document.documentElement;
const dark = (() => {
  try {
    return localStorage.getItem('bronto-ui-site-theme') === 'dark';
  } catch {
    return false;
  }
})();
if (dark) html.dataset.theme = 'dark';
for (const toggle of document.querySelectorAll('[data-theme-toggle]')) {
  const sync = () => {
    const enabled = html.dataset.theme === 'dark';
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? 'Switch to light theme' : 'Switch to dark theme');
  };
  sync();
  toggle.addEventListener('click', () => {
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('bronto-ui-site-theme', html.dataset.theme);
    } catch {}
    sync();
  });
}
const menu = document.querySelector('[data-menu-toggle]');
const nav = document.getElementById('site-nav');
if (menu && nav) {
  menu.addEventListener('click', () => {
    const on = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(on));
    menu.setAttribute('aria-label', on ? 'Close navigation' : 'Open navigation');
    nav.dataset.open = String(on);
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      menu.setAttribute('aria-expanded', 'false');
      nav.dataset.open = 'false';
    }
  });
}
const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  return false;
};
for (const btn of document.querySelectorAll('[data-copy]')) {
  btn.addEventListener('click', async () => {
    const code =
      btn.closest('.code-header')?.nextElementSibling?.querySelector('code') ||
      btn.closest('.component-code')?.querySelector('pre code');
    if (!code) return;
    try {
      await copyText(code.textContent);
      const prior = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => {
        btn.textContent = prior;
      }, 1400);
    } catch {
      btn.textContent = 'Select to copy';
    }
  });
}
const componentCatalog = document.querySelector('[data-component-catalog]');
if (componentCatalog) {
  const input = componentCatalog.querySelector('[data-component-query]');
  const chips = [...componentCatalog.querySelectorAll('[data-component-chip]')];
  const cards = [...componentCatalog.querySelectorAll('[data-component-card]')];
  const count = componentCatalog.querySelector('[data-component-count]');
  const empty = componentCatalog.querySelector('[data-component-empty]');
  let category = 'All';
  const update = () => {
    const query = input.value.trim().toLowerCase();
    let shown = 0;
    for (const card of cards) {
      const match =
        (category === 'All' || card.dataset.category === category) &&
        (card.dataset.search || '').includes(query);
      card.hidden = !match;
      if (match) shown++;
    }
    count.textContent = `${shown} pattern${shown === 1 ? '' : 's'} shown`;
    empty.hidden = shown !== 0;
    chips.forEach((chip) =>
      chip.setAttribute('aria-pressed', String(chip.dataset.componentChip === category)),
    );
  };
  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      category = chip.dataset.componentChip;
      update();
    }),
  );
  input.addEventListener('input', update);
  update();
}
const docsSearchInput = document.querySelector('[data-doc-search]');
if (docsSearchInput) {
  const results = document.querySelector('[data-doc-results]');
  const groups = document.querySelector('[data-doc-groups]');
  let docsPromise;
  const load = () =>
    (docsPromise ||= fetch(`${root}docs/search-index.json`).then(async (r) => {
      if (!r.ok) throw Error('Unable to load documentation search');
      return r.json();
    }));
  let token = 0;
  const search = async () => {
    const query = docsSearchInput.value.trim().toLowerCase();
    const myToken = ++token;
    if (query.length < 2) {
      results.hidden = true;
      results.replaceChildren();
      groups.hidden = false;
      return;
    }
    groups.hidden = true;
    results.hidden = false;
    results.textContent = 'Searching…';
    try {
      const docs = await load();
      if (myToken !== token) return;
      const words = query.split(/\s+/).filter(Boolean);
      const scored = docs
        .map((d) => {
          const head = d.title.toLowerCase(),
            body = (d.content || '').toLowerCase();
          return {
            d,
            score: words.reduce(
              (sum, w) => sum + (head.includes(w) ? 10 : 0) + (body.includes(w) ? 1 : 0),
              0,
            ),
          };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
      results.replaceChildren();
      for (const { d } of scored) {
        const a = document.createElement('a');
        a.className = 'doc-search-result';
        a.href = root + d.url;
        const type = document.createElement('span');
        type.className = 'doc-search-result__type';
        type.textContent = d.category;
        const title = document.createElement('strong');
        title.textContent = d.title;
        const excerpt = document.createElement('span');
        excerpt.textContent = d.description;
        a.append(type, title, excerpt);
        results.appendChild(a);
      }
      if (!scored.length) results.textContent = 'No matches. Try a different term.';
    } catch {
      results.textContent = 'Search is unavailable; browse the sections below.';
      groups.hidden = false;
    }
  };
  docsSearchInput.addEventListener('input', search);
}
// Previous demo/README links used /docs/#reporting.md. This needs to
// handle both direct loads and same-document hash changes from the docs index.
function redirectLegacyDocHash() {
  if (!location.pathname.endsWith('/docs/')) return;
  const legacy = /^#([A-Za-z0-9_\/-]+)\.md(#.*)?$/.exec(location.hash);
  if (legacy) location.replace(`${root}docs/${legacy[1]}.html${legacy[2] || ''}`);
}
window.addEventListener('hashchange', redirectLegacyDocHash);
redirectLegacyDocHash();
