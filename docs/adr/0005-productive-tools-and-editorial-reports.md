# 0005. Productive tools and editorial reports

Status: accepted — applies from 0.10.0

## Context

The shared CSS and evidence vocabulary serve several independently deployed
applications and static reports. The same display typography and nested
frames were applied to everyday controls, dense panels, and long documents.
Small headings and labels were difficult to distinguish, and a narrow
workbench could fit the viewport while leaving its preview unreadably narrow.

The framework adapter and controlled-modal paths deprecated in 0.7 remained
unadopted in the inspected downstream applications. Maintaining them multiplied
types, examples, peers, and parity checks without improving those applications.

## Decision

Keep CSS as the universal layer, with optional dependency-free vanilla
behaviors. Default to readable sans typography and sentence case for headings,
controls, and labels. Keep Doto through explicit display and glyph primitives.
Use tabular numbers and monospace where the content benefits from them.

Treat tools and reports as two compositions of the same identity. Tool chrome
stays quiet and compact. Reports use a reading measure, larger screen prose,
an early decision, and a separate print treatment. These are CSS and authoring
recipes, not parallel themes or rendering frameworks.

Use available container width when composing an inspector. The host still owns
whether split panes stack, collapse, or switch. Supply a complete narrow-pane
recipe instead of silently changing every splitter's behavior.

Remove the five framework adapter entrypoints and the controlled modal in
0.10.0. Keep native dialog styling and behavior. Maintain packed examples for
the inspected consumer stacks and the CSS/report integration boundaries.
Applications may use specialist behavior libraries for complex controls and
style them with the shared tokens; the universal package does not wrap them.

A new public surface needs a demonstrated task and evidence that the proposed
composition improves it. A shipped hand-built duplicate is useful evidence,
not a prerequisite. Prototype freely and prefer a recipe when existing classes
can express the result. Adoption percentage and class count are not targets.

## Consequences

The release changes visual defaults and removes deprecated imports. Consumers
must review complete screens and migrate together; see the
[0.10 migration](../migrations/0.9-to-0.10.md).

Keep packed import/type checks, generated-contract checks, accessibility,
behavior, and print verification. Remove only obligations associated with
retired surface. Compare a service overview, an inspector, and a decision
report before adding catalog. The examples prove compatibility; real consumer
upgrades prove the release's practical value.

The raw default-CSS budget is 100,000 bytes and the gzip budget is 18,000 bytes.
This deliberate headroom replaces a nearly full ceiling. Payload changes
remain measured and reviewed; specialist report/tooling leaves stay opt-in.
