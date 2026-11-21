/** Public examples and their real screenshot/source routes. */
export const examples = [
  {
    key: 'workspace',
    name: 'Evidence workspace',
    eyebrow: 'INSPECTABLE TOOLS',
    desc: 'Compare observations, inspect a captured source, record a review, and print the evidence in one coherent interface.',
    story:
      'Follow a result from measurement to decision. Select a captured or unobserved run, inspect its provenance, and choose the next step. The chart follows the theme and the same evidence stays readable in print.',
    tech: [
      'Selection and inspection',
      'Keyboard-safe nested controls',
      'Source and print continuity',
    ],
    image: 'workspace.jpg',
    demo: 'workspace-evidence.html',
    docs: 'compositions.html#workspace-evidence-review',
    source: [
      'demo/workspace-evidence.html',
      'demo/workspace-evidence.css',
      'demo/workspace-evidence.mjs',
    ],
    implementation:
      'Uses Bronto controls, a workbench inspector, source and figure styles, a toolbar, action menu, dialog, combobox and native popover. The small host script owns synthetic observations, in-memory review decisions and SVG geometry. Bronto supplies the shared interaction contracts and resolved theme colors. No backend, framework, production claim or persistent review is implied.',
    accent: 'The result, its source, and the next decision stay together.',
  },
  {
    key: 'operations',
    name: 'Operations dashboard',
    eyebrow: 'APPLICATION UI',
    desc: 'A full service shell with navigation, workload status, tables, filters, and operational feedback.',
    story:
      'The same interface grammar works across services. This example assembles familiar pieces into a practical control surface without a component runtime.',
    tech: ['Application shell', 'Metrics & tables', 'Status and feedback'],
    image: 'operations.jpg',
    demo: 'service.html',
    docs: 'usage.html',
    source: ['demo/service.html', 'demo/service.css', 'demo/service.js'],
    implementation:
      'Uses the standard Bronto UI app shell, metric and table classes, with a small host stylesheet and local script for navigation, filters, job creation and appearance settings. Sample job data belongs to the fixture; the library does not supply an API or backend.',
    accent: 'A functioning interface, not just a collection of buttons.',
  },
  {
    key: 'reports',
    name: 'Reliability report',
    eyebrow: 'STATIC REPORT',
    desc: 'An evidence-oriented, print-ready platform report, rendered from ordinary HTML and CSS.',
    story:
      'A finished decision report with explicit claims, supporting evidence, timelines, and data context. It works without JavaScript and can be printed as a PDF.',
    tech: ['Readable editorial layout', 'Evidence & provenance', 'Print and PDF'],
    image: 'report.jpg',
    demo: 'report-standalone.html',
    docs: 'reporting.html',
    source: ['demo/report-standalone.html'],
    implementation:
      'Uses semantic headings, report-oriented CSS, tables and evidence sections in a single HTML document. The report content is sample data and remains printable without running JavaScript.',
    accent: 'One HTML document can be a readable webpage and a report.',
  },
  {
    key: 'theming',
    name: 'Theme playground',
    eyebrow: 'DESIGN SYSTEM',
    desc: 'Change the accent, inspect generated color roles, and validate contrast without rebuilding your components.',
    story:
      'Bronto UI makes brand expression a deliberate input instead of a second set of components. The playground shows the actual color derivation and contrast ratios.',
    tech: ['Single accent control', 'Light and dark', 'Contrast checks'],
    image: 'theming.jpg',
    demo: 'theme-playground.html',
    docs: 'theming.html',
    source: ['demo/theme-playground.html'],
    implementation:
      'A plain HTML page sets the accent token and computes contrast in a local script. The example shows how the Bronto UI theme tokens project into light, dark and accent surfaces.',
    accent: 'Change a token and understand what changes with it.',
  },
];
