// Curated examples, grounded in demo/index.html and the shipped .ui-* surface.
// The authoritative generated class inventory remains docs/reference.md.
export const components = [
  {
    name: 'Buttons',
    category: 'Foundations',
    doc: 'usage',
    summary: 'Primary and quieter actions with the same visual grammar.',
    markup: `<button class="ui-button" type="button">Create item</button>
<button class="ui-button ui-button--subtle" type="button">Secondary</button>
<button class="ui-button ui-button--ghost" type="button">Ghost</button>`,
  },
  {
    name: 'Cards',
    category: 'Composition',
    doc: 'compositions',
    summary: 'Group related content without prescribing its data model.',
    markup: `<article class="ui-card" style="max-width:340px">
  <span class="ui-eyebrow">Workspace</span>
  <h3 style="margin:8px 0">Project overview</h3>
  <p class="ui-muted" style="margin:0">Healthy and up to date.</p>
</article>`,
  },
  {
    name: 'Badges',
    category: 'Status',
    doc: 'state',
    summary: 'Communicate meaning in a compact, scannable treatment.',
    markup: `<span class="ui-badge ui-badge--success">Healthy</span>
<span class="ui-badge ui-badge--warning">Pending</span>
<span class="ui-badge ui-badge--danger">Blocked</span>
<span class="ui-badge ui-badge--accent">New</span>`,
  },
  {
    name: 'Live states',
    category: 'Status',
    doc: 'state',
    summary: 'A state vocabulary for jobs, services, and other workflows.',
    markup: `<span class="ui-status"><span class="ui-dot ui-dot--live"></span> Online</span>
<span class="ui-status"><span class="ui-dot ui-dot--warning"></span> Degraded</span>
<span class="ui-status"><span class="ui-dot ui-dot--danger"></span> Down</span>`,
  },
  {
    name: 'Text fields',
    category: 'Forms',
    doc: 'usage',
    summary: 'Labeled, semantic form controls that work with the browser.',
    markup: `<label class="ui-field" style="width:min(100%,340px)">
  <span class="ui-label">Workspace name</span>
  <input class="ui-input" placeholder="My project" type="text" />
</label>`,
  },
  {
    name: 'Switches',
    category: 'Forms',
    doc: 'usage',
    summary: 'Native checkbox state with a legible custom track.',
    markup: `<label class="ui-switch">
  <input type="checkbox" role="switch" checked />
  <span class="ui-switch__track"><span class="ui-switch__thumb"></span></span>
  <span>Enable notifications</span>
</label>`,
  },
  {
    name: 'Alerts',
    category: 'Status',
    doc: 'usage',
    summary: 'Operational feedback using accessible semantic colors.',
    markup: `<div class="ui-alert ui-alert--info">
  <p class="ui-alert__title">Update available</p>
  <p class="ui-alert__body">New changes are ready for review.</p>
</div>`,
  },
  {
    name: 'Metrics',
    category: 'Data',
    doc: 'compositions',
    summary: 'Densely presented values with contextual change.',
    markup: `<div class="ui-statgrid">
  <div class="ui-stat">
    <span class="ui-stat__label">Requests</span>
    <span class="ui-stat__value">24.8k</span>
    <span class="ui-stat__delta is-pos">▲ 8%</span>
  </div>
  <div class="ui-stat">
    <span class="ui-stat__label">Latency</span>
    <span class="ui-stat__value">42ms</span>
    <span class="ui-stat__delta">— steady</span>
  </div>
</div>`,
  },
  {
    name: 'Data tables',
    category: 'Data',
    doc: 'usage',
    summary: 'Compare rows and status without introducing a table framework.',
    markup: `<div class="ui-table-wrap">
  <table class="ui-table ui-table--dense">
    <caption class="ui-visually-hidden">Recent job status</caption>
    <thead><tr><th>Job</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>daily-sync</td><td><span class="ui-badge ui-badge--success">Ready</span></td></tr>
      <tr><td>export</td><td><span class="ui-badge ui-badge--warning">Queued</span></td></tr>
    </tbody>
  </table>
</div>`,
  },
  {
    name: 'Progress',
    category: 'Status',
    doc: 'usage',
    summary: 'Track work without relying on color alone.',
    markup: `<div class="ui-progress" role="progressbar" aria-label="Import progress"
  aria-valuenow="64" aria-valuemin="0" aria-valuemax="100"
  style="width:100%;max-width:360px">
  <div class="ui-progress__bar" style="--value:64"></div>
</div>`,
  },
  {
    name: 'Breadcrumbs',
    category: 'Composition',
    doc: 'usage',
    summary: 'Indicate position in an interface hierarchy.',
    markup: `<nav aria-label="Breadcrumb">
  <ol class="ui-breadcrumb">
    <li class="ui-breadcrumb__item"><a href="#main">Projects</a></li>
    <li class="ui-breadcrumb__item"><a href="#main">Team</a></li>
    <li class="ui-breadcrumb__item" aria-current="page">Overview</li>
  </ol>
</nav>`,
  },
  {
    name: 'Chips',
    category: 'Foundations',
    doc: 'usage',
    summary: 'Small categorical labels for filters and identity.',
    markup: `<span class="ui-chip">Frontend</span>
<span class="ui-chip ui-chip--accent">Active</span>
<span class="ui-chip ui-chip--dense">Development</span>`,
  },
  {
    name: 'Loading skeletons',
    category: 'Status',
    doc: 'usage',
    summary: 'Communicate placeholder structure while content loads.',
    markup: `<div style="width:100%;max-width:300px;display:grid;gap:10px">
  <div class="ui-skeleton" style="height:1.5rem;width:70%"></div>
  <div class="ui-skeleton" style="height:.85rem;width:100%"></div>
  <div class="ui-skeleton" style="height:.85rem;width:82%"></div>
</div>`,
  },
  {
    name: 'Tags',
    category: 'Foundations',
    doc: 'usage',
    summary: 'A compact collection for content classification.',
    markup: `<ul class="ui-tags">
  <li class="ui-tag ui-tag--accent">design</li>
  <li class="ui-tag">systems</li>
  <li class="ui-tag">css</li>
</ul>`,
  },
  {
    name: 'Panels',
    category: 'Composition',
    doc: 'compositions',
    summary: 'A quieter alternative to a raised card.',
    markup: `<div class="ui-panel" style="width:100%;max-width:350px">
  <span class="ui-eyebrow">Context</span>
  <p style="margin:.5rem 0 0">One focused area of related information.</p>
</div>`,
  },
  {
    name: 'Key/value details',
    category: 'Data',
    doc: 'compositions',
    summary: 'Concise labels and values for an inspector or report.',
    markup: `<dl class="ui-key-value">
  <div><dt>Runtime</dt><dd>Containers</dd></div>
  <div><dt>Status</dt><dd>Reconciled</dd></div>
</dl>`,
  },
  {
    name: 'Measured values',
    category: 'Data',
    doc: 'usage',
    summary: 'Use a meter for a measurement, not for task progress.',
    markup: `<div class="ui-meter ui-meter--success" role="meter" aria-label="Coverage"
  aria-valuenow="72" aria-valuemin="0" aria-valuemax="100"
  style="width:100%;max-width:330px">
  <span class="ui-meter__fill" style="--value:72"></span>
</div>`,
  },
  {
    name: 'Process steps',
    category: 'Composition',
    doc: 'compositions',
    summary: 'Show the current step in a short ordered process.',
    markup: `<ol class="ui-steps" style="width:100%;max-width:360px">
  <li class="ui-steps__item ui-steps__item--done">Connect</li>
  <li class="ui-steps__item" aria-current="step">Review</li>
  <li class="ui-steps__item">Confirm</li>
</ol>`,
  },
  {
    name: 'Identity avatars',
    category: 'Foundations',
    doc: 'usage',
    summary: 'Small operator initials without requiring an image asset.',
    markup: `<span class="ui-avatar" role="img" aria-label="Platform operator">PO</span>
<span class="ui-avatar ui-avatar--sm" role="img" aria-label="Service owner">SO</span>`,
  },
  {
    name: 'Keyboard shortcuts',
    category: 'Foundations',
    doc: 'usage',
    summary: 'Render keyboard hints with semantic keycap elements.',
    markup: `<span class="ui-shortcut">
  <kbd class="ui-kbd">Ctrl</kbd>
  <span class="ui-shortcut__sep">+</span>
  <kbd class="ui-kbd">K</kbd>
</span>`,
  },
  {
    name: 'Claims and evidence',
    category: 'Reports',
    doc: 'reporting',
    summary:
      'A sample claim with its scope, evidence state, limitation, and a source you can inspect.',
    styles: ['report', 'sources'],
    markup: `<div class="ui-stack" style="inline-size:100%">
  <article class="ui-claim ui-claim--partial">
    <h3 class="ui-claim__statement">The smaller batch reduced latency.</h3>
    <p class="ui-claim__status">Evidence state: partial · sample data</p>
    <p class="ui-claim__scope">Scope: one staging run</p>
    <p class="ui-claim__basis">Basis: p95 fell from 120 ms to 96 ms.</p>
    <p class="ui-claim__limits">Limit: production load has not been tested.</p>
    <p class="ui-claim__refs"><a class="ui-citation" href="#catalog-claim-source" aria-label="Source: staging run">Source 1</a></p>
  </article>
  <article class="ui-source-card ui-src--reviewed" id="catalog-claim-source">
    <h3 class="ui-source-card__title">Staging run</h3>
    <p class="ui-source-card__origin">Reviewed sample · synthetic measurements</p>
    <p class="ui-source-card__excerpt">One run supports a trial, not a production guarantee.</p>
  </article>
</div>`,
  },
  {
    name: 'Sources and provenance',
    category: 'Reports',
    doc: 'sources',
    summary:
      'Show review and freshness in words beside a source; the application supplies the trust decision.',
    styles: ['sources'],
    markup: `<article class="ui-source-card ui-src--stale" style="inline-size:100%">
  <h3 class="ui-source-card__title">Capacity review</h3>
  <p class="ui-source-card__origin">Sample source · operations team</p>
  <p class="ui-source-card__time"><time datetime="2026-09-01">1 September 2026</time> · stale</p>
  <p class="ui-source-card__excerpt">Recheck the capacity estimate before using it for a new rollout.</p>
  <p class="ui-provenance">
    <span class="ui-provenance__item ui-src--reviewed">Human-reviewed</span>
    <span class="ui-provenance__item ui-src--stale">Refresh required</span>
  </p>
</article>`,
  },
  {
    name: 'Inspector and splitter',
    category: 'Workbench',
    doc: 'workbench',
    summary:
      'Resize a real inspector with arrow keys or ordinary buttons. The host owns the selected object.',
    styles: ['workbench'],
    setup: `import { initSplitter } from '@ponchia/ui/behaviors';

const stopSplitter = initSplitter();
// Call stopSplitter() when your page or component unmounts.`,
    markup: `<div class="ui-splitter ui-splitter--vertical" data-bronto-splitter
  style="--splitter-pos:55%;inline-size:100%">
  <section class="ui-splitter__pane" id="catalog-inspector-pane" aria-label="Selected job">
    <aside class="ui-inspector" aria-label="Job inspector">
      <div class="ui-inspector__head"><h3 class="ui-eyebrow">Daily sync</h3></div>
      <div class="ui-inspector__body">
        <div class="ui-property"><span class="ui-property__label">Owner</span><span class="ui-property__value">Platform</span></div>
        <div class="ui-property"><span class="ui-property__label">State</span><span class="ui-property__value">Ready</span></div>
      </div>
    </aside>
    <div class="ui-cluster" role="group" aria-label="Resize inspector">
      <button class="ui-button ui-button--subtle ui-button--sm" type="button" data-bronto-splitter-adjust="-10">Narrow</button>
      <button class="ui-button ui-button--subtle ui-button--sm" type="button" data-bronto-splitter-adjust="10">Widen</button>
    </div>
  </section>
  <div class="ui-splitter__handle" role="separator" tabindex="0"
    aria-controls="catalog-inspector-pane" aria-label="Resize inspector"
    aria-orientation="vertical" aria-valuemin="35" aria-valuemax="70" aria-valuenow="55"></div>
  <section class="ui-splitter__pane" aria-label="Job preview">
    <h3 class="ui-eyebrow">Preview</h3>
    <p>Host-owned job details remain here while the inspector resizes.</p>
  </section>
</div>`,
  },
  {
    name: 'Command palette',
    category: 'Workbench',
    doc: 'command',
    summary:
      'Open, filter, and choose a sample command. Keyboard navigation belongs to Bronto; execution belongs to the host.',
    styles: ['command'],
    setup: `import { initCommand, initDialog } from '@ponchia/ui/behaviors';

const stopDialog = initDialog();
const stopCommand = initCommand();
const palette = document.getElementById('catalog-commands');
const result = document.getElementById('catalog-command-result');
function select(event) {
  result.textContent = 'Selected: ' + event.detail.label;
  palette.close(); // Replace this sample effect with your authorized action.
}
function close() { palette.close(); }
palette.addEventListener('bronto:command:select', select);
palette.addEventListener('bronto:command:close', close);
function dispose() {
  palette.removeEventListener('bronto:command:select', select);
  palette.removeEventListener('bronto:command:close', close);
  stopCommand();
  stopDialog();
}
// Call dispose() when your page or component unmounts.`,
    markup: `<div>
  <button class="ui-button" type="button" data-bronto-open="catalog-commands" aria-haspopup="dialog" aria-controls="catalog-commands">Open sample commands</button>
  <p id="catalog-command-result" role="status">Choose a sample command.</p>
  <dialog class="ui-modal" id="catalog-commands" data-bronto-dialog-light aria-label="Sample commands">
    <div class="ui-command" data-bronto-command>
      <input class="ui-command__input" aria-label="Find a sample command" placeholder="Type a command…" />
      <ul class="ui-command__list">
        <li class="ui-command__group">Sample actions</li>
        <li class="ui-command__item" data-value="inspect"><span>Inspect selected job</span></li>
        <li class="ui-command__item" data-value="report"><span>Open evidence report</span></li>
      </ul>
      <p class="ui-command__empty" hidden>No matching commands</p>
    </div>
    <button class="ui-button ui-button--subtle" type="button" data-bronto-close>Close commands</button>
  </dialog>
</div>`,
  },
  {
    name: 'Finding and figure fallback',
    category: 'Reports',
    doc: 'figure',
    summary:
      'An audit finding with a labelled chart and the same values in a readable table, including in print.',
    styles: ['report', 'figure'],
    markup: `<div class="ui-stack" style="inline-size:100%">
  <article class="ui-report__finding ui-report__finding--major" aria-labelledby="catalog-finding">
    <h3 class="ui-eyebrow" id="catalog-finding">Major finding · sample</h3>
    <p class="ui-report__finding-claim">The baseline exceeds the 100 ms latency target.</p>
    <p class="ui-report__finding-remediation">Trial the smaller batch before production.</p>
    <p class="ui-report__finding-caveat">These synthetic values explain the pattern only.</p>
  </article>
  <figure class="ui-figure" role="group" aria-labelledby="catalog-figure-caption">
    <figcaption class="ui-figure__caption" id="catalog-figure-caption">Sample p95 latency (ms)</figcaption>
    <div class="ui-figure__stage" style="--figure-min-block:8rem">
      <svg class="ui-figure__media" viewBox="0 0 280 100" role="img" aria-labelledby="catalog-chart-title catalog-chart-desc">
        <title id="catalog-chart-title">Baseline and smaller batch latency</title>
        <desc id="catalog-chart-desc">Baseline: 120 milliseconds. Smaller batch: 96 milliseconds.</desc>
        <text x="0" y="28" fill="var(--text-dim)" font-size="12">Baseline</text>
        <rect x="90" y="12" width="150" height="22" fill="var(--text)" />
        <text x="0" y="72" fill="var(--text-dim)" font-size="12">Trial</text>
        <rect x="90" y="56" width="120" height="22" fill="var(--text-dim)" />
      </svg>
    </div>
    <div class="ui-figure__data ui-table-wrap">
      <table class="ui-table ui-table--dense">
        <caption>Sample latency values</caption>
        <thead><tr><th scope="col">Run</th><th scope="col">p95 (ms)</th></tr></thead>
        <tbody><tr><th scope="row">Baseline</th><td>120</td></tr><tr><th scope="row">Smaller batch</th><td>96</td></tr></tbody>
      </table>
    </div>
  </figure>
</div>`,
  },
];
