/** Public examples and their real screenshot/source routes. */
export const examples = [
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
    source: ['demo/service.html', 'demo/service.js'],
    implementation:
      'Uses the standard Bronto UI app shell, metric and table classes, plus a short local script that changes demo states. Sample job data belongs to the fixture; the library does not supply an API or backend.',
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
