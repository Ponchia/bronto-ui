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
];
