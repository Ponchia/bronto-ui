import { initDialog } from '../behaviors/dialog.js';

// This small host owns local sample data and hash navigation, not the package.
// No network request, persistence, external integration or scheduled work.
initDialog();
const doc = document;
const root = doc.documentElement;
const scenario = doc.querySelector('#scenario');
const environment = doc.querySelector('#environment');
const search = doc.querySelector('input[type="search"]');
const tbody = doc.querySelector('#jobs tbody');
const message = doc.querySelector('#jobs-message');
const results = doc.querySelector('#job-results');
const health = doc.querySelector('#health');
const freshness = doc.querySelector('#freshness');
const healthState = doc.querySelector('#health-state');
const jobRegion = doc.querySelector('#jobs');
const notice = doc.querySelector('#service-notice');
const jobDialog = doc.querySelector('#new-job');
const jobForm = doc.querySelector('#new-job-form');
const jobInput = jobForm.elements.namedItem('job');
const preferences = doc.querySelector('#preferences-form');
const rows = [...tbody.rows];
const titles = {
  overview: 'Service overview',
  jobs: 'Jobs',
  integrations: 'Integrations',
  settings: 'Settings',
};
let view = 'overview';

function environmentLabel() {
  return environment.selectedOptions[0].textContent;
}

function filterRows() {
  const query = search.value.trim().toLocaleLowerCase();
  const limit = view === 'overview' && !query ? 4 : Infinity;
  let matches = 0;
  let shown = 0;
  for (const row of rows) {
    const searchable =
      `${row.cells[0].textContent} ${row.cells[1].textContent}`.toLocaleLowerCase();
    const match = row.dataset.environment === environment.value && searchable.includes(query);
    if (match) matches++;
    row.hidden = !match || shown >= limit;
    if (!row.hidden) shown++;
  }
  return { matches, shown };
}

function renderHealth() {
  const staging = environment.value === 'staging';
  const active = rows.filter(
    (row) => row.dataset.environment === environment.value && row.dataset.status !== 'complete',
  ).length;
  doc.querySelector('#active-count').textContent = String(active);
  const delta = active - 2;
  const deltaLabel = doc.querySelector('#active-delta');
  deltaLabel.className = `ui-delta ui-delta--${delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}`;
  deltaLabel.textContent = `${delta > 0 ? '+' : ''}${delta} since prior sample`;
  doc.querySelector('#queue-delay').textContent = staging ? '8s' : '42s';
  doc.querySelector('#queue-delta').textContent = staging
    ? '−4s since prior sample'
    : '−11s since prior sample';
  healthState.className = `ui-badge ui-badge--${scenario.value === 'stale' ? 'warning' : 'success'}`;
  healthState.textContent = scenario.value === 'stale' ? 'Last known: operational' : 'Operational';
}

function renderFreshness(state) {
  freshness.className = `ui-state${state === 'ready' ? ' ui-state--reviewed' : state === 'stale' ? ' ui-state--stale' : state === 'error' ? ' ui-state--error' : ''}`;
  freshness.textContent =
    state === 'ready'
      ? 'Sample data ready'
      : state === 'stale'
        ? 'Older sample data'
        : 'Current state unknown';
}

function renderJobs() {
  const state = scenario.value;
  const unavailable = ['loading', 'empty', 'error'].includes(state);
  const { matches, shown } = filterRows();
  const total = rows.filter((row) => row.dataset.environment === environment.value).length;
  results.hidden = unavailable || matches === 0;
  health.hidden = unavailable || view !== 'overview';
  jobRegion.setAttribute('aria-busy', String(state === 'loading'));
  doc.querySelector('#jobs-title').textContent = view === 'jobs' ? 'All jobs' : 'Recent jobs';
  doc.querySelector('#jobs-description').textContent = unavailable
    ? `Sample ${state} scenario · ${environmentLabel()}`
    : `${shown} of ${total} jobs · ${environmentLabel()}`;
  renderFreshness(state);
  const messages = {
    loading: 'Loading jobs. Current health has not been observed.',
    empty: 'No jobs yet. Create a sample job to start.',
    error: 'Jobs could not be loaded. Use Sync to retry.',
    stale: 'Showing older observations. Use Sync to refresh.',
  };
  message.textContent =
    messages[state] || (matches === 0 ? 'No matching jobs. Change the search or environment.' : '');
  message.hidden = !message.textContent;
  doc.querySelector('#jobs-empty').hidden = message.hidden;
  doc.querySelector('#reset-filters').hidden = unavailable || matches > 0;
  doc.querySelector('#retry-jobs').hidden = !['error', 'stale', 'loading'].includes(state);
  doc.querySelector('#empty-create').hidden = state !== 'empty';
}

function render() {
  const label = environmentLabel();
  doc.querySelectorAll('[data-environment-label]').forEach((el) => {
    el.textContent = label;
  });
  doc.querySelector('#page-context').textContent = ['overview', 'jobs'].includes(view)
    ? `${label} workspace · Local demo`
    : 'Local demo · No external services';
  renderHealth();
  renderJobs();
}

function renderView(focus = false) {
  const target = location.hash.slice(1);
  view = Object.hasOwn(titles, target) ? target : 'overview';
  doc.querySelector('h1').textContent = titles[view];
  doc.title = `${titles[view]} · Bronto Ops`;
  doc.querySelectorAll('.ui-app-nav a').forEach((link) => {
    if (link.hash === `#${view}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  doc.querySelectorAll('[data-service-view]').forEach((el) => {
    el.hidden = !el.dataset.serviceView.split(' ').includes(view);
  });
  notice.textContent = '';
  if (view === 'settings') {
    preferences.elements.namedItem('theme').value =
      root.dataset.theme === 'light' ? 'light' : 'dark';
    preferences.elements.namedItem('density').value = root.dataset.density || 'default';
  }
  render();
  if (focus) {
    doc.querySelector('h1').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

doc.addEventListener('click', (event) => {
  const link = event.target.closest('.ui-app-nav a, .ui-app-rail__brand, [data-service-link]');
  if (
    !link ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  if (!Object.hasOwn(titles, link.hash.slice(1))) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  renderView(true);
});
doc.querySelector('.ui-skiplink').addEventListener('click', (event) => {
  event.preventDefault();
  const main = doc.querySelector('#app-main');
  main.focus();
  main.scrollIntoView({ block: 'start', behavior: 'instant' });
});
window.addEventListener('popstate', () => renderView(true));
window.addEventListener('hashchange', () => renderView(true));
for (const control of [scenario, environment, search])
  control.addEventListener('input', () => {
    notice.textContent = '';
    render();
  });

function syncJobs() {
  const restoreFocus = doc.activeElement === doc.querySelector('#retry-jobs');
  scenario.value = 'ready';
  render();
  notice.textContent = 'Sample data refreshed. No external request was made.';
  if (restoreFocus) doc.querySelector('#sync-jobs').focus();
}
doc.querySelector('#sync-jobs').addEventListener('click', syncJobs);
doc.querySelector('#retry-jobs').addEventListener('click', syncJobs);
doc.querySelector('#reset-filters').addEventListener('click', () => {
  search.value = '';
  render();
  search.focus();
});

function appendJob(name) {
  const row = doc.createElement('tr');
  row.dataset.environment = environment.value;
  row.dataset.status = 'queued';
  const nameCell = row.insertCell();
  nameCell.className = 'is-key';
  const jobName = doc.createElement('span');
  jobName.className = 'service-job-name';
  jobName.textContent = name;
  const owner = doc.createElement('span');
  owner.className = 'service-job-owner';
  owner.textContent = 'Operator';
  nameCell.append(jobName, owner);
  row.insertCell().textContent = 'Operator';
  const status = doc.createElement('span');
  status.className = 'service-job-status';
  const dot = doc.createElement('span');
  dot.className = 'ui-dot ui-dot--warning';
  dot.setAttribute('aria-hidden', 'true');
  status.append(dot, 'Queued');
  row.insertCell().append(status);
  const runtime = row.insertCell();
  runtime.className = 'is-num';
  runtime.textContent = '—';
  tbody.prepend(row);
  rows.unshift(row);
}

jobForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = jobInput.value.trim();
  const duplicate = rows.some(
    (row) =>
      row.dataset.environment === environment.value &&
      row.querySelector('.service-job-name').textContent.toLocaleLowerCase() ===
        name.toLocaleLowerCase(),
  );
  jobInput.setCustomValidity(
    !name
      ? 'Enter a job name, not only spaces.'
      : duplicate
        ? 'This name already exists in the selected environment.'
        : '',
  );
  if (!jobInput.reportValidity()) return;
  appendJob(name);
  scenario.value = 'ready';
  search.value = '';
  render();
  notice.textContent = `${name} added to ${environmentLabel()} as a local queued job.`;
  jobDialog.close();
});
jobInput.addEventListener('input', () => jobInput.setCustomValidity(''));
jobDialog.addEventListener('close', () => {
  jobForm.reset();
  jobInput.setCustomValidity('');
  // The empty-state opener disappears after creating the first sample job.
  // Let native/library focus restoration run, then use the visible toolbar action.
  queueMicrotask(() => {
    if (doc.activeElement === doc.body) {
      doc.querySelector('.service-actions [data-bronto-open]').focus();
    }
  });
});

function applyPreferences(theme, density) {
  root.dataset.theme = theme;
  root.dataset.density = density;
  doc.querySelector('#preferences-notice').textContent =
    `Saved for this tab: ${theme} theme, ${density} spacing.`;
}
preferences.addEventListener('submit', (event) => {
  event.preventDefault();
  applyPreferences(
    preferences.elements.namedItem('theme').value,
    preferences.elements.namedItem('density').value,
  );
});
doc.querySelector('#reset-preferences').addEventListener('click', () => {
  preferences.reset();
  applyPreferences('dark', 'default');
});

doc.querySelectorAll('[data-service-action]').forEach((control) => {
  control.disabled = false;
});
renderView();
root.dataset.demoReady = '1';
