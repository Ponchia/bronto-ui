import {
  hasDom,
  resolveHost,
  noop,
  bindOnce,
  byIdInHost,
  collectHosts,
  scrollIntoViewSafe,
} from './internal.js';

/**
 * @typedef {object} SourceFocusDetail
 * @property {string} id The focused source-card id.
 * @property {Element} citation The citation/control that requested the source.
 * @property {Element} source The target source card or source element.
 */

const REF_SELECTOR = '[data-bronto-source-ref], .ui-citation[href^="#"]';
const ACTIVE = 'is-source-active';

function sourceId(ref) {
  const explicit = ref.getAttribute('data-bronto-source-ref');
  if (explicit) return explicit.replace(/^#/, '');
  const href = ref.getAttribute('href') || '';
  if (!href.startsWith('#') || href === '#') return '';
  try {
    return decodeURIComponent(href.slice(1));
  } catch {
    return href.slice(1);
  }
}

function sourcePreview(source) {
  const text = (selector) =>
    source.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const title = text('.ui-source-card__title');
  const meta = [text('.ui-source-card__origin'), text('.ui-source-card__time')]
    .filter(Boolean)
    .join(' · ');
  const excerpt = text('.ui-source-card__excerpt');
  return [title, meta, excerpt].filter(Boolean).join(' — ');
}

/**
 * Source/citation affordances for the `sources.css` trust layer. The behavior
 * is deliberately small: within each `[data-bronto-sources]` island it resolves
 * `.ui-citation[href^="#"]` and `[data-bronto-source-ref]` controls to source
 * cards, adds non-visual preview metadata (`title` + `aria-describedby`), and
 * on activation moves focus to the source card with a temporary
 * `.is-source-active` highlight. The host still owns fetching, numbering,
 * trust decisions, and any rich preview UI.
 *
 * @param {import('./internal.js').DelegateOpts} [opts]
 * @returns {import('./internal.js').Cleanup}
 */
export function initSources({ root } = {}) {
  if (!hasDom()) return noop;
  const host = resolveHost(root);
  if (!host) return noop;

  const islands = collectHosts(host, '[data-bronto-sources]');
  const cleanups = [];

  for (const island of islands) {
    const timers = new Set();
    const seeded = [];

    const targetFor = (ref) => {
      const id = sourceId(ref);
      if (!id) return null;
      return byIdInHost(island, id);
    };

    const seed = () => {
      for (const ref of island.querySelectorAll(REF_SELECTOR)) {
        const source = targetFor(ref);
        if (!source?.id) continue;

        const describedBy = ref.getAttribute('aria-describedby') || '';
        const describedIds = describedBy.split(/\s+/).filter(Boolean);
        const title = ref.getAttribute('title');
        const preview = sourcePreview(source);
        const prior = {
          ref,
          describedBy,
          hadDescribedBy: ref.hasAttribute('aria-describedby'),
          title,
          hadTitle: ref.hasAttribute('title'),
        };

        if (!describedIds.includes(source.id)) {
          ref.setAttribute('aria-describedby', [...describedIds, source.id].join(' '));
        }
        if (!title && preview) ref.setAttribute('title', preview);
        if (!source.hasAttribute('tabindex')) {
          prior.source = source;
          prior.hadTabindex = false;
          source.setAttribute('tabindex', '-1');
        }
        seeded.push(prior);
      }
    };

    const focusSource = (ref, source) => {
      for (const card of island.querySelectorAll(`.${ACTIVE}`)) card.classList.remove(ACTIVE);
      for (const timer of timers) clearTimeout(timer);
      timers.clear();

      source.classList.add(ACTIVE);
      source.focus?.({ preventScroll: true });
      scrollIntoViewSafe(source);

      const timer = setTimeout(() => {
        source.classList.remove(ACTIVE);
        timers.delete(timer);
      }, 1600);
      timers.add(timer);

      island.dispatchEvent(
        new CustomEvent('bronto:source:focus', {
          detail: { id: source.id, citation: ref, source },
          bubbles: true,
        }),
      );
    };

    const onClick = (e) => {
      const ref = e.target.closest?.(REF_SELECTOR);
      if (!ref || !island.contains(ref)) return;
      const source = targetFor(ref);
      if (!source) return;
      if (!ref.matches('a[href]')) e.preventDefault();
      focusSource(ref, source);
    };

    const cleanup = bindOnce(island, 'sources', () => {
      seed();
      island.addEventListener('click', onClick);
      return () => {
        island.removeEventListener('click', onClick);
        for (const timer of timers) clearTimeout(timer);
        timers.clear();
        for (const item of seeded.splice(0)) {
          if (item.hadDescribedBy) item.ref.setAttribute('aria-describedby', item.describedBy);
          else item.ref.removeAttribute('aria-describedby');
          if (item.hadTitle) item.ref.setAttribute('title', item.title);
          else item.ref.removeAttribute('title');
          if (item.source && item.hadTabindex === false) item.source.removeAttribute('tabindex');
        }
        for (const card of island.querySelectorAll(`.${ACTIVE}`)) card.classList.remove(ACTIVE);
      };
    });

    cleanups.push(cleanup);
  }

  return () => cleanups.forEach((fn) => fn());
}
