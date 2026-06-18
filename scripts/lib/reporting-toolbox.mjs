/**
 * The report toolbox routing table: every opt-in analytical leaf that
 * docs/reporting.md promises report authors can reach from the toolbox section.
 *
 * Keep doc paths relative to docs/ so check-report can enforce both the CSS/JS
 * route and the handbook link from one registry.
 */
export const REPORTING_TOOLBOX_LEAVES = [
  ['dataviz', 'theming.md#data-viz-palette'],
  ['figure', 'figure.md'],
  ['marks', 'marks.md'],
  ['sources', 'sources.md'],
  ['interval', 'interval.md'],
  ['clamp', 'clamp.md'],
  ['highlights', 'highlights.md'],
  ['annotations', 'annotations.md'],
  ['connectors', 'connectors.md'],
  ['legend', 'legends.md'],
  ['spotlight', 'spotlight.md'],
  ['crosshair', 'crosshair.md'],
  ['selection', 'selection.md'],
  ['generated', 'generated.md'],
  ['state', 'state.md'],
  ['workbench', 'workbench.md'],
  ['command', 'command.md'],
  ['spark', 'spark.md'],
  ['bullet', 'bullet.md'],
  ['diff', 'diff.md'],
  ['code', 'code.md'],
  ['sidenote', 'sidenote.md'],
  ['textref', 'textref.md'],
  ['term', 'term.md'],
  ['toc', 'toc.md'],
  ['tree', 'tree.md'],
];

export const REPORTING_TOOLBOX_JS = [
  ['@ponchia/ui/mermaid', 'mermaid.md'],
  ['@ponchia/ui/d2', 'd2.md'],
  ['@ponchia/ui/vega', 'vega.md'],
];
