import {
  initActionMenu,
  initCombobox,
  initDialog,
  initPopover,
  initThemeToggle,
  initToolbar,
} from '@ponchia/ui/behaviors';
import { readTokens, observeTokens } from '@ponchia/ui/renderer';

// Fixture-owned observations and decisions. The library owns no application data.
const observations = {
  baseline: {
    name: 'Baseline',
    value: 120,
    capture: '20 Nov 2026, 09:00 UTC',
    revision: 'sample-batch-01',
    state: 'Captured · above target',
    conclusion: 'The baseline exceeds the 100 ms target by 20 ms.',
    basis: 'This gives the trial a comparison point. It does not isolate the cause of the delay.',
    source: 'Captured run / batch-01',
    excerpt: 'p95_ms=120; batch_size=100; requests=1000; environment=staging',
    note: 'One run captured at 09:00 UTC. No production measurement is included.',
    nextStep: 'Investigate the baseline',
  },
  trial: {
    name: 'Smaller batch',
    value: 96,
    capture: '20 Nov 2026, 09:15 UTC',
    revision: 'sample-batch-02',
    state: 'Captured · provisional',
    conclusion: 'The sample is 20% faster. Repeat it before a production change.',
    basis:
      'A smaller batch is worth another staging run. This single sample does not establish production reliability.',
    source: 'Captured run / batch-02',
    excerpt: 'p95_ms=96; batch_size=50; requests=1000; environment=staging',
    note: 'One run captured at 09:15 UTC. No production measurement is included.',
    nextStep: 'Repeat in staging',
  },
  repeat: {
    name: 'Repeat run',
    value: null,
    capture: 'No result captured',
    revision: 'sample-batch-03',
    state: 'Unknown · awaiting result',
    conclusion: 'The repeat run has no observed result. Its latency is unknown.',
    basis:
      'Keep the provisional trial separate from this pending observation. Wait for a measurement before making a comparison.',
    source: 'Pending run / batch-03',
    excerpt: 'p95_ms=unobserved; batch_size=50; requests=unobserved; environment=staging',
    note: 'A queued run is not a completed or successful run. No capture exists for this observation.',
    nextStep: 'Wait for an observed result',
  },
};
const reviews = new Map();
let selected = 'trial';
const get = (id) => document.getElementById(id);
const listen = (target, event, listener) => {
  target.addEventListener(event, listener);
  return () => target.removeEventListener(event, listener);
};
const text = (id, value) => {
  get(id).textContent = value;
};
const cleanups = [initToolbar(), initThemeToggle(), initDialog(), initCombobox(), initPopover()];

function paintChart(tokens) {
  const svg = document.querySelector('.evidence-chart');
  // The fixture renderer consumes resolved literals, just like Canvas or Vega.
  // CSS remains a readable fallback before JavaScript and for print.
  const colors = {
    ink: tokens.text,
    baseline: tokens.textDim,
    selected: tokens.text,
    axis: tokens.lineStrong,
    target: tokens.textDim,
  };
  for (const [role, color] of Object.entries(colors)) {
    for (const node of svg.querySelectorAll(`[data-chart-${role}]`)) {
      node.setAttribute(node.tagName.toLowerCase() === 'line' ? 'stroke' : 'fill', color);
    }
  }
  svg.dataset.scheme = tokens.scheme;
}
paintChart(readTokens());
cleanups.push(observeTokens(paintChart));

function renderSelection() {
  const observation = observations[selected];
  const measured = observation.value !== null;
  text('result-heading', observation.name);
  text('result-state', observation.state);
  text('result-conclusion', observation.conclusion);
  text('result-basis', observation.basis);
  text('capture-time', observation.capture);
  text('capture-revision', observation.revision);
  text(
    'capture-freshness',
    measured ? 'Historical capture; not re-read' : 'No observation available',
  );
  text('source-heading', observation.source);
  text('source-excerpt', observation.excerpt);
  text('source-note', observation.note);
  text('table-selected-name', observation.name);
  text('table-selected-value', measured ? `${observation.value} ms` : 'Not observed');
  text('table-selected-state', measured ? 'One captured run' : 'No measurement');
  text('chart-selected-value', measured ? String(observation.value) : 'Not observed');
  get('chart-selected-value').setAttribute(
    'x',
    measured ? String(122 + observation.value * 2) : '122',
  );
  get('chart-selected-bar').setAttribute('width', measured ? String(observation.value * 2) : '0');
  text(
    'latency-description',
    `Baseline: 120 milliseconds. ${observation.name}: ${measured ? observation.value + ' milliseconds' : 'not observed'}. Target: 100 milliseconds. Synthetic sample data.`,
  );
  text(
    'review-receipt',
    reviews.has(selected)
      ? `Local review recorded: ${reviews.get(selected)}. Evidence status remains ${observation.state.toLowerCase()}.`
      : 'No decision recorded in this session.',
  );
  text('review-observation', observation.name);
  get('review-next-step').value = reviews.get(selected) || observation.nextStep;
  get('review-next-step').removeAttribute('aria-invalid');
  get('review-next-step').setAttribute('aria-describedby', 'review-help');
  get('review-error').hidden = true;
}
for (const input of document.querySelectorAll('[name="observation"]')) {
  cleanups.push(
    listen(input, 'change', () => {
      if (input.checked && observations[input.value]) {
        selected = input.value;
        renderSelection();
      }
    }),
  );
}

const trigger = get('evidence-actions-trigger');
const menu = get('evidence-actions');
let stopMenu;
function closeMenu() {
  menu.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
  stopMenu?.();
  stopMenu = undefined;
}
cleanups.push(
  listen(trigger, 'click', () => {
    if (!menu.hidden) return closeMenu();
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    stopMenu = initActionMenu({ root: menu, invoker: trigger, onClose: closeMenu });
  }),
);
cleanups.push(
  listen(get('focus-source'), 'click', () => {
    get('captured-source').focus();
    get('captured-source').scrollIntoView({ block: 'nearest' });
  }),
);
for (const button of document.querySelectorAll('[data-print-brief]')) {
  cleanups.push(listen(button, 'click', () => window.print()));
}
cleanups.push(
  listen(get('review-form'), 'submit', (event) => {
    event.preventDefault();
    const input = get('review-next-step');
    const value = input.value.trim();
    const valid = Object.values(observations).some((observation) => observation.nextStep === value);
    if (!valid) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', 'review-help review-error');
      get('review-error').hidden = false;
      input.focus();
      return;
    }
    reviews.set(selected, value);
    renderSelection();
    get('review-dialog').close();
  }),
);

renderSelection();
for (const element of document.querySelectorAll('[data-workspace-enhance]')) element.hidden = false;
for (const element of document.querySelectorAll('[data-workspace-enable]'))
  element.disabled = false;
function dispose() {
  closeMenu();
  cleanups.splice(0).forEach((stop) => stop());
  window.removeEventListener('pagehide', pageHidden);
}
function pageHidden(event) {
  // A cached document resumes with the same DOM and module instance.
  // Keep its controls and token observer alive until it is actually disposed.
  if (!event.persisted) dispose();
}
window.addEventListener('pagehide', pageHidden);
if (import.meta.hot) import.meta.hot.dispose(dispose);
