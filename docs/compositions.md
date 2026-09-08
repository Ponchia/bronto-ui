# Compose a tool or report

Start with the task and its important state. Use the catalog to find a part,
not to decide how many parts a page should contain.

## Service overview

Load the core CSS and the opt-in state leaf. Use `ui-app-shell` for navigation,
`ui-app-topbar` for the page title and primary action, and `ui-app-content` for
the current state and work queue. Panels group content without adding another
frame around every metric and table.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/state.css';
```

Use sentence-case labels. Keep the main action distinguishable from destructive
actions through wording and placement. Use `ui-delta--invert` when a decrease
is favorable, such as queue delay. Unknown, stale, and failed are distinct
states; do not present missing observations as success.

The complete specimen is [service.html](https://ponchia.github.io/bronto-ui/demo/service.html). On a phone,
navigation wraps and the compact metrics leave room for the work queue.
Check the main action, every navigation destination, and a long account name
at 360px and with a coarse pointer. A data table may scroll in its own region.

## Inspector and workbench

Load `workbench.css` beside core. An inspector supplies its own container
boundary: property rows stack below 20rem of available inline size, including
inside a narrow panel on a wide desktop.

```html
<aside class="ui-inspector" aria-label="Selected job">
  <header class="ui-inspector__head"><h2>Job settings</h2></header>
  <div class="ui-inspector__body">
    <div class="ui-property">
      <label class="ui-property__label" for="retry-count">Retry limit</label>
      <div class="ui-property__value">
        <input class="ui-input" id="retry-count" type="number" value="3" />
      </div>
    </div>
  </div>
</aside>
```

A splitter does not choose a product's collapse policy. The
[workbench specimen](https://ponchia.github.io/bronto-ui/demo/workbench.html) stacks its two panes below 42rem
of container width and hides the inactive resize handle and resize controls.
Both panes remain available. A tool that needs a pane switch instead should
keep that policy in its own component.

Keep a badge inside a `ui-row__meta` wrapper rather than applying both classes
to the same element: the wrapper owns layout and the badge owns its tone.

Use `ui-chip--dense` for static labels inside short pane headers. Dense chips
on buttons, links, or button roles retain pointer target floors. Use regular
buttons for actions; a colored chip is not an action registry.

Test the resize control’s keyboard and pointer paths at wide sizes, then verify
that the narrow layout has no hidden keyboard-reachable resize control and both panes
have a useful reading width. Test the inspector inside a 280px parent while
the browser itself is wide.

## Decision report

Use the core stylesheet plus `report-kit.css` for a standalone HTML report.
Use real asset URLs in HTML; package specifiers resolve only in build tools.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.10.0/dist/bronto.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ponchia/ui@0.10.0/dist/css/report-kit.css" />
<article class="ui-report">
  <header class="ui-report__cover ui-report__cover--compact">
    <h1 class="ui-report__title">Keep the current configuration</h1>
    <p class="ui-report__subtitle">Queue delay improved; verify the next scheduled run.</p>
  </header>
  <section class="ui-report__section" aria-labelledby="decision-title">
    <h2 class="ui-report__section-head" id="decision-title">Decision and basis</h2>
    <p>The completed runs support keeping the change. The next batch remains unobserved.</p>
  </section>
  <details class="ui-report__toc ui-screen-only">
    <summary>Contents and evidence</summary>
    <ol><li><a href="#decision-title">Decision and basis</a></li></ol>
  </details>
</article>
```

Screen prose is 1.125rem with a 68ch maximum reading measure; the report can
still contain wider figures and evidence tables. Print uses 11pt ink-on-white
text. Use the `--report-measure` and `--report-width` hooks deliberately.
Do not apply `ui-display` to every report heading.

The [standalone specimen](https://ponchia.github.io/bronto-ui/demo/report-standalone.html) keeps its decision
before collapsed navigation. Verify the recommendation and its source are
findable, the text remains readable at narrow widths, and the PDF retains
claims, captions, and evidence across page boundaries.

## Display identity

`ui-display`, dot glyphs, and readouts preserve the expressive identity.
Use them for a short hero title or deliberate display moment. Ordinary `h1`
through `h4`, prose, labels, and controls use sans typography. Fixed-width type is for
code, identifiers, and aligned data; a whole page does not need to be mono to
look technical.

Use one dominant action per local task. Separate navigation, action, severity,
and evidence status semantically even when they share a color family. Test
light and dark together, and keep keyboard focus and reduced motion visible.
