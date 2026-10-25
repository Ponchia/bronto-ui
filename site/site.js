// Progressive enhancements only: this site remains navigable with JavaScript off.
const root = document.body.dataset.siteRoot || './';
const html = document.documentElement;
for (const toggle of document.querySelectorAll('[data-theme-toggle]')) {
  toggle.hidden = false;
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
  const setNavigation = (open, restoreFocus = false) => {
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.dataset.open = String(open);
    if (open) nav.querySelector('a')?.focus();
    if (restoreFocus) menu.focus();
  };
  nav.dataset.enhanced = 'true';
  menu.hidden = false;
  menu.addEventListener('click', () => {
    setNavigation(menu.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setNavigation(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || menu.getAttribute('aria-expanded') !== 'true') return;
    setNavigation(false, true);
  });
  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) setNavigation(false);
  });
}
const copyText = async (value) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  return false;
};
const copySource = (button) =>
  button.closest('.code-header')?.nextElementSibling?.querySelector('code') ||
  button.closest('.component-code, .doc-code-example')?.querySelector('pre code');

function selectCode(code) {
  code.closest('pre')?.focus();
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(code);
  selection.removeAllRanges();
  selection.addRange(range);
}

// Generated Markdown guides contain real code blocks. Make their original
// source text copyable without changing the canonical Markdown or HTML
// semantics. The enhancement is optional: plain code still renders without JS.
for (const pre of document.querySelectorAll('.doc-prose pre')) {
  if (!pre.querySelector('code')) continue;
  const wrapper = document.createElement('div');
  wrapper.className = 'doc-code-example';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'copy-button doc-code-example__copy';
  copy.setAttribute('data-copy', '');
  copy.textContent = 'Copy code';
  pre.before(wrapper);
  wrapper.append(copy, pre);
}
for (const btn of document.querySelectorAll('[data-copy]')) {
  const originalLabel = btn.textContent;
  let resetTimer;
  let request = 0;
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    const code = copySource(btn);
    if (!code) return;
    const currentRequest = ++request;
    clearTimeout(resetTimer);
    let copied = false;
    try {
      copied = await copyText(code.textContent);
    } catch {
      // Denied clipboard access uses the same keyboard-reachable fallback.
    }
    if (currentRequest !== request) return;
    btn.textContent = copied ? 'Copied' : 'Select to copy';
    if (!copied) selectCode(code);
    resetTimer = setTimeout(() => {
      btn.textContent = originalLabel;
    }, 1400);
  });
}
const componentCatalog = document.querySelector('[data-component-catalog]');
if (componentCatalog) {
  componentCatalog.querySelector('.catalog-controls').hidden = false;
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
  docsSearchInput.closest('label').hidden = false;
  const results = document.querySelector('[data-doc-results]');
  const groups = document.querySelector('[data-doc-groups]');
  let docsPromise;
  const load = () =>
    (docsPromise ||= fetch(`${root}docs/search-index.json`)
      .then(async (r) => {
        if (!r.ok) throw Error('Unable to load documentation search');
        return r.json();
      })
      .catch((error) => {
        docsPromise = undefined;
        throw error;
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
            score: words.every((word) => head.includes(word) || body.includes(word))
              ? words.reduce(
                  (sum, word) =>
                    sum + (head.includes(word) ? 10 : 0) + (body.includes(word) ? 1 : 0),
                  0,
                )
              : 0,
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
      if (myToken !== token) return;
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

// A native dialog is centered inside its iframe, not the outer viewport.
// Reveal the working frame when a dialog opens; do not shift the parent page
// after ordinary navigation, typing or pointer events.
for (const frame of document.querySelectorAll('.iframe-frame iframe')) {
  const bound = new WeakSet();
  const bind = () => {
    const child = frame.contentDocument;
    if (!child?.documentElement || bound.has(child)) return;
    bound.add(child);
    const reveal = () => {
      const rect = frame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const top =
        (document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0) + 16;
      if (rect.top < top || rect.bottom > innerHeight - 16) {
        window.scrollBy({ top: rect.top - top, behavior: 'instant' });
      }
    };
    const observer = new MutationObserver((records) => {
      if (records.some(({ target }) => target.matches('dialog[open]'))) reveal();
    });
    observer.observe(child.documentElement, {
      attributes: true,
      attributeFilter: ['open'],
      subtree: true,
    });
    child.defaultView.addEventListener('pagehide', (event) => {
      if (event.persisted) return;
      observer.disconnect();
      bound.delete(child);
    });
    // A dialog may already be open when a slow resource finally fires load.
    if (child.querySelector('dialog[open]')) reveal();
  };
  frame.addEventListener('load', bind);
  // Lazy frames can accept input before load. Bind to their current document
  // when a pointer enters or focus crosses into it, not only after resources.
  frame.addEventListener('pointerenter', bind);
  frame.addEventListener('focus', bind);
  window.addEventListener('blur', bind);
  bind();
}
