import { initDialog } from '../behaviors/dialog.js';

// Product state belongs to the host. These deterministic scenarios are local
// sample data, not a framework data store or a simulated production request.
initDialog();
const scenario = document.querySelector('#scenario');
const environment = document.querySelector('#environment');
const search = document.querySelector('input[type="search"]');
const tbody = document.querySelector('#jobs tbody');
const message = document.querySelector('#jobs-message');
const results = document.querySelector('#job-results');
const health = document.querySelector('#health');
const freshness = document.querySelector('#freshness');
const healthState = document.querySelector('#health-state');
const jobRegion = document.querySelector('#jobs');
const rows = [...tbody.rows];
rows.forEach((row, index) => {
  row.dataset.environment = index === 1 ? 'staging' : 'production';
});

function filterRows(query) {
  let matches = 0;
  for (const row of rows) {
    row.hidden =
      row.dataset.environment !== environment.value ||
      !row.textContent.toLocaleLowerCase().includes(query);
    if (!row.hidden) matches++;
  }
  return matches;
}

function render() {
  const state = scenario.value;
  const unavailable = ['loading', 'empty', 'error'].includes(state);
  const query = search.value.trim().toLocaleLowerCase();
  const matches = filterRows(query);
  results.hidden = unavailable || matches === 0;
  health.hidden = unavailable;
  jobRegion.setAttribute('aria-busy', String(state === 'loading'));
  freshness.className = `ui-state${state === 'ready' ? ' ui-state--reviewed' : state === 'stale' ? ' ui-state--stale' : state === 'error' ? ' ui-state--error' : ''}`;
  freshness.textContent =
    state === 'ready'
      ? 'Reviewed just now'
      : state === 'stale'
        ? 'Stale · last checked 2 hours ago'
        : 'Current state unknown';
  healthState.className = `ui-badge ui-badge--${state === 'stale' ? 'warning' : 'success'}`;
  healthState.textContent = state === 'stale' ? 'Last known: operational' : 'Operational';
  const messages = {
    loading: 'Loading jobs. Current health has not been observed.',
    empty: 'No jobs yet. Create a sample job to start.',
    error: 'Jobs could not be loaded. Use Sync to retry.',
    stale: 'Showing older observations. Use Sync to refresh.',
  };
  message.textContent =
    messages[state] || (matches === 0 ? 'No matching jobs. Change the search or environment.' : '');
  message.hidden = !message.textContent;
}
for (const control of [scenario, environment, search]) control.addEventListener('input', render);
document.querySelector('#sync-jobs').addEventListener('click', () => {
  scenario.value = 'ready';
  render();
});
document.querySelector('#new-job-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.namedItem('job').value.trim();
  if (!name) return;
  const row = document.createElement('tr');
  row.dataset.environment = environment.value;
  for (const value of [name, 'Operator', 'Queued', '00:00']) {
    const cell = row.insertCell();
    cell.textContent = value;
  }
  tbody.append(row);
  rows.push(row);
  scenario.value = 'ready';
  search.value = '';
  render();
  form.reset();
  document.querySelector('#new-job').close();
});
render();
document.documentElement.dataset.demoReady = '1';
