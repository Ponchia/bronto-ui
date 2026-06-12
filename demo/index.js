import {
  initThemeToggle,
  dismissible,
  initDialog,
  initTabs,
  initDisclosure,
  initMenu,
  initCombobox,
  initPopover,
  initFormValidation,
  initTableSort,
  initCarousel,
  initDotGlyph,
  initLegend,
  initConnectors,
  initCrosshair,
  initCommand,
  initSplitter,
  toast,
} from '../behaviors/index.js';
import { ui, cx } from '../classes/index.js';
import { directLabels } from '../annotations/index.js';
import { renderGlyph, GLYPH_NAMES } from '../glyphs/glyphs.js';
import { skins, SKIN_NAMES } from '../tokens/skins.js';

// A representative slice of the glyph set (full list in the docs).
const GALLERY = [
  'arrow-right',
  'chevron-down',
  'check',
  'close',
  'plus',
  'search',
  'menu',
  'gear',
  'edit',
  'trash',
  'download',
  'play',
  'eye',
  'sun',
  'bell',
  'heart',
  'home',
  'user',
  'star',
  'spark',
];

const gallery = document.getElementById('glyphGallery');
if (gallery) {
  for (const name of GALLERY) {
    const cell = document.createElement('span');
    cell.className = 'ui-stack';
    cell.style.cssText = '--stack-gap: var(--space-2xs); align-items: center';
    const g = document.createElement('span');
    g.setAttribute('data-bronto-glyph', name);
    g.setAttribute('data-bronto-glyph-label', name);
    g.style.cssText = '--dotmatrix-dot: 0.28rem; --dotmatrix-gap: 0.07rem';
    const cap = document.createElement('span');
    cap.className = 'ui-muted';
    cap.style.fontSize = '0.6rem';
    cap.textContent = name;
    cell.append(g, cap);
    gallery.appendChild(cell);
  }
}

const glyphButtons = document.getElementById('glyphButtons');
if (glyphButtons) {
  for (const [name, text] of [
    ['search', 'Search'],
    ['plus', 'New'],
    ['check', 'Confirm'],
    ['gear', 'Settings'],
    ['close', 'Dismiss'],
  ]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = name === 'plus' ? 'ui-button' : 'ui-button ui-button--subtle';
    btn.style.cssText = 'display: inline-flex; align-items: center; gap: 0.45rem';
    btn.innerHTML = renderGlyph(name, { solid: true, dot: '1.2px' }) + `<span>${text}</span>`;
    glyphButtons.appendChild(btn);
  }
}

const glyphMask = document.getElementById('glyphMask');
if (glyphMask) {
  glyphMask.innerHTML = [
    'search',
    'check-circle',
    'x-circle',
    'plus-circle',
    'circle',
    'external',
    'gear',
  ]
    .filter((n) => GLYPH_NAMES.includes(n))
    .map((n) => renderGlyph(n, { render: 'mask', label: n }))
    .join('');
}

const glyphAnim = document.getElementById('glyphAnim');
if (glyphAnim) {
  const revealBox = document.createElement('span');
  const drawReveal = () => {
    revealBox.innerHTML = renderGlyph('spark', { anim: 'reveal', dot: '0.34rem', gap: '0.1rem' });
  };
  drawReveal();
  const replay = document.createElement('button');
  replay.type = 'button';
  replay.className = 'ui-button ui-button--subtle ui-button--sm';
  replay.textContent = 'Replay reveal';
  // Replay the one-shot reveal. A deliberate click is its own opt-in, so it
  // plays even when the global "Preview motion" toggle is off: rebuild the
  // matrix, force a reflow, then flag `.demo-reveal-on` — the bronto-preview
  // cascade layer (index.css) keys the per-cell scan off that flag.
  replay.addEventListener('click', () => {
    revealBox.classList.remove('demo-reveal-on');
    drawReveal();
    void revealBox.offsetWidth;
    revealBox.classList.add('demo-reveal-on');
  });

  const pulseBox = document.createElement('span');
  pulseBox.innerHTML = renderGlyph('bell', {
    anim: 'pulse',
    dot: '0.34rem',
    gap: '0.1rem',
    label: 'Notifications',
  });

  glyphAnim.append(revealBox, replay, pulseBox);
}

// Live direct-labeling dogfood: a small series whose labels would collide
// at their data y; directLabels declutters them into a leadered column.
const annoSvg = document.getElementById('anno-directlabels');
if (annoSvg) {
  const NS = 'http://www.w3.org/2000/svg';
  const pts = [
    { x: 30, y: 120, label: 'Jan' },
    { x: 110, y: 96, label: 'Feb' },
    { x: 190, y: 88, label: 'Mar' },
    { x: 270, y: 44, label: 'Apr' },
  ];
  const labels = directLabels(
    pts.map((p) => ({ anchor: { x: p.x, y: p.y }, size: 22, key: p.label })),
    { axis: 'y', cross: 296, gap: 6, min: 14, max: 156 },
  );
  const make = (tag, attrs, text) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text != null) el.textContent = text;
    return el;
  };
  annoSvg.appendChild(
    make('polyline', {
      points: pts.map((p) => `${p.x},${p.y}`).join(' '),
      fill: 'none',
      stroke: 'var(--line-strong)',
      'stroke-width': '1.5',
    }),
  );
  labels.forEach((l, i) => {
    annoSvg.appendChild(make('path', { class: 'ui-annotation__connector', d: l.d }));
    annoSvg.appendChild(
      make('circle', { cx: l.anchor.x, cy: l.anchor.y, r: '3.5', fill: 'var(--accent)' }),
    );
    annoSvg.appendChild(
      make(
        'text',
        {
          class: 'ui-annotation__label',
          x: l.x + 6,
          y: l.y,
          'dominant-baseline': 'middle',
          'font-size': '12',
          fill: 'var(--text-soft)',
        },
        pts[i].label,
      ),
    );
  });
}

initThemeToggle();
dismissible();
initDialog();
initTabs(); // full keyboard a11y, wired from the shipped module
initDisclosure();
initMenu();
initCombobox();
initPopover();
initFormValidation();
initTableSort();
initCarousel(); // wires both the inline carousel and the lightbox's
initDotGlyph(); // expands [data-bronto-glyph] placeholders (incl. the skin preview)
initConnectors(); // draws + tracks the leader lines in the analytical tier
initCrosshair(); // pointer-tracking crosshair in the analytical tier
initLegend(); // interactive legend toggle in the analytical tier
initCommand(); // command-palette filtering in the frontier tier
initSplitter(); // workbench pane resizing in the frontier tier

// Command palette: host-owned, like the legend/crosshair below. Bronto filters
// + navigates and emits the event; the host (this demo) owns what a selection
// DOES — here we just echo it so the specimen isn't a dead end.
const commandStatus = document.getElementById('command-status');
document.addEventListener('bronto:command:select', (e) => {
  const { value, label } = e.detail;
  if (commandStatus) commandStatus.textContent = `Selected: ${label} (${value})`;
});

// Legend: host-owned. Bronto flips the control + announces; we hide the bar.
const legendStatus = document.getElementById('legend-status');
document.addEventListener('bronto:legend:toggle', (e) => {
  const { series, active } = e.detail;
  const bar = document.querySelector(`[data-series-bar="${CSS.escape(series)}"]`);
  // style.display (not .hidden): the series marks are SVG <g> nodes, and
  // `hidden` is an HTMLElement property that does not reflect onto SVG.
  if (bar) bar.style.display = active ? '' : 'none';
  if (legendStatus) legendStatus.textContent = `${series} ${active ? 'shown' : 'hidden'}`;
});

// Crosshair: host-owned. Bronto reports position; we map + render the readout.
const xhReadout = document.getElementById('xh-readout');
const xhStatus = document.getElementById('xh-status');
const plot = document.querySelector('[data-bronto-crosshair]');
if (plot) {
  plot.addEventListener('bronto:crosshair:move', (e) => {
    const { fx, fy } = e.detail;
    const text = `x ${(fx * 100).toFixed(0)}% · y ${((1 - fy) * 100).toFixed(0)}%`;
    xhReadout.textContent = text;
    xhStatus.textContent = `Pointer: ${text}`;
  });
  plot.addEventListener('bronto:crosshair:leave', () => {
    xhStatus.textContent = 'Pointer: —';
  });
}

// Unified theme picker: light/dark (data-theme), colorway (data-bronto-skin),
// dark surface (data-surface) — all set on <html>, the way a real consumer themes.
const themeRoot = document.documentElement;
const SKIN_KEY = 'bronto-skin';
const SURFACE_KEY = 'bronto-surface';
const skinSelect = document.getElementById('skinSelect');
const surfaceSelect = document.getElementById('surfaceSelect');
const skinSwitch = document.getElementById('skinSwitch');
const skinOptions = [['', 'Default'], ...SKIN_NAMES.map((n) => [n, skins[n].label])];
const persist = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage blocked — still applies for this session */
  }
};

const applySkin = (value) => {
  if (value) themeRoot.setAttribute('data-bronto-skin', value);
  else themeRoot.removeAttribute('data-bronto-skin');
  persist(SKIN_KEY, value);
  if (skinSelect) skinSelect.value = value;
  if (skinSwitch)
    for (const b of skinSwitch.children)
      b.setAttribute('aria-pressed', String(b.dataset.skin === value));
};
const applySurface = (value) => {
  if (value) themeRoot.setAttribute('data-surface', value);
  else themeRoot.removeAttribute('data-surface');
  persist(SURFACE_KEY, value);
  if (surfaceSelect) surfaceSelect.value = value;
};

if (skinSelect) {
  for (const [value, label] of skinOptions) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    skinSelect.appendChild(opt);
  }
  skinSelect.addEventListener('change', () => applySkin(skinSelect.value));
}
if (skinSwitch) {
  for (const [value, label] of skinOptions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ui-button ui-button--sm';
    btn.textContent = label;
    btn.dataset.skin = value;
    btn.addEventListener('click', () => applySkin(value));
    skinSwitch.appendChild(btn);
  }
}
if (surfaceSelect)
  surfaceSelect.addEventListener('change', () => applySurface(surfaceSelect.value));

let storedSkin = '';
let storedSurface = '';
try {
  storedSkin = localStorage.getItem(SKIN_KEY) || '';
  storedSurface = localStorage.getItem(SURFACE_KEY) || '';
} catch {
  /* storage blocked */
}
applySkin(SKIN_NAMES.includes(storedSkin) ? storedSkin : '');
applySurface(storedSurface === 'oled' ? 'oled' : '');

document.getElementById('toastBtn').addEventListener('click', () => {
  toast('Order filled — BTC/EUR', { tone: 'success', title: 'Done' });
});

// Theming contract: one --accent knob re-brands; density/contrast are presets.
const docEl = document.documentElement;
for (const b of document.querySelectorAll('[data-accent]'))
  b.addEventListener('click', () => docEl.style.setProperty('--accent', b.dataset.accent));
for (const r of document.querySelectorAll('input[name="dens"]'))
  r.addEventListener('change', () => {
    if (r.value) docEl.dataset.density = r.value;
    else delete docEl.dataset.density;
  });
document.getElementById('contrastChk').addEventListener('change', (e) => {
  if (e.target.checked) docEl.dataset.contrast = 'high';
  else delete docEl.dataset.contrast;
});

// RTL toggle — proves the logical-properties sweep mirrors cleanly.
const dirBtn = document.getElementById('dirBtn');
dirBtn.addEventListener('click', () => {
  const rtl = document.documentElement.dir === 'rtl';
  document.documentElement.dir = rtl ? 'ltr' : 'rtl';
  dirBtn.textContent = rtl ? 'DIR: LTR' : 'DIR: RTL';
});

// Preview-motion toggle — flips `.demo-motion` on <html>. All the actual
// motion restoration lives in the `bronto-preview` cascade layer (index.css):
// declared before bronto.css, so its !important rules beat the library's
// layered-!important reduced-motion reset (important layer order is reversed —
// the one cascade path that wins). Review affordance only; the shipped default
// (honour prefers-reduced-motion) is never changed.
const motionBtn = document.getElementById('motionBtn');
motionBtn.addEventListener('click', () => {
  const on = document.documentElement.classList.toggle('demo-motion');
  motionBtn.setAttribute('aria-pressed', String(on));
  motionBtn.textContent = on ? 'Motion: on' : 'Preview motion';
});

// Keep the demo's theme label in sync (cosmetic; the shared module does the work).
const root = document.documentElement;
const label = document.getElementById('themeLabel');
const sync = () => {
  label.textContent = root.getAttribute('data-theme') === 'light' ? 'Light' : 'Dark';
};
sync();
document.addEventListener('bronto:themechange', sync);

// Smoke-check the typed class recipes resolve to real classes.
console.assert(
  ui.button({ variant: 'ghost' }) === 'ui-button ui-button--ghost',
  'classes recipe mismatch',
);

// Deterministic readiness signal for the e2e suite. This module is loaded as an
// external <script type="module"> (an extra fetch + import graph), and it builds
// content synchronously above (the glyph gallery, command list, etc.). Flag the
// document once that synchronous wiring is done so tests can wait on a real
// signal instead of `networkidle` + a fixed timeout — which raced the JS-built
// sections (glyph-gallery screenshot instability, sortable-table init).
document.documentElement.dataset.demoReady = '1';
