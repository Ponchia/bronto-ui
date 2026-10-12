# Roadmap

`@ponchia/ui` is the shared CSS identity and evidence vocabulary for a set of
owned applications and reports. Its purpose is to improve those interfaces
and reduce repeated design decisions. Class count, framework count, and
adoption percentage are not targets.

The [changelog](CHANGELOG.md) records releases. The
[stability contract](docs/stability.md) defines compatibility. The
[composition recipes](docs/compositions.md) show the current design direction.

## North star

Objects on a canvas that explain themselves. The main consumer is a zoomable
workspace whose surfaces are notes, visual models and decks, themed live across
skins and read at any zoom. A report is one of those objects, printed, and stays
a supported lane. A change earns its place when that workspace can delete its
own code because of it.

## Surface is admitted by evidence

A public addition needs a demonstrated task and evidence that the proposed
composition improves it. A consumer's existing implementation is useful
input, not a requirement to ship a duplicate before improving the design.
Prototype freely. Prefer a recipe when existing classes express the result.

Package examples prove compatibility. Real consumer upgrades prove demand and
practical value. Before retiring an unused surface, check that consumers could
find it; a leaf that is not imported does not prove a lack of need.

## Current direction

- Keep CSS as the universal layer, with portable tokens and optional vanilla
  behaviors. Keep routing, persistence, chart scales, and product policy in
  applications.
- Use readable productive typography for tools and an editorial treatment for
  reports. Keep a selective display signature rather than applying it to
  every label. See [ADR-0005](docs/adr/0005-productive-tools-and-editorial-reports.md).
- Compare complete service, inspector, and report compositions using real
  content, narrow containers, keyboard/touch input, and both themes.
- Keep the framework adapter and controlled-modal removals from 0.10 in place
  ([ADR-0004](docs/adr/0004-prune-unused-adapters.md)). Improve framework lifecycle
  recipes and packed examples when a real integration needs them.
- Keep packed contracts, accessibility, behavior, and print proof. Consolidate
  checks around surviving sources of truth rather than adding parallel lists.
- Keep reports, analytical, provenance, workbench, and command leaves opt-in.
  Review payload changes in the actual consumer, with deliberate budget margin.

## Investment test

A development cycle should improve at least one real composition and make its
next change easier. Record overrides removed, semantics corrected, and tasks
made clearer. If a cycle only adds catalog or tooling, stop expanding and
return to consumer work.

1.0 is a compatibility promise, not a design milestone. Choose it after the
new compositions and coordinated upgrades are proven. Do not freeze an awkward
visual default merely to reach a version number. Recent releases changed the
categorical palette, renderer tokens, note prose, density, layers, and zoom.
The next step is to prove that the resulting contract is useful and predictable
across real consumer upgrades. The [1.0 readiness ledger](docs/stability.md#10-readiness-ledger)
defines the evidence required for a candidate.

**Releases follow deletions.** Cut a release when a consumer change is ready to
delete what it replaces, and land that deletion as the upgrade. A release that
nothing is waiting to consume waits too.

## Boundaries

No universal framework components, chart engine, large data grid, router,
persistence layer, workflow engine, or global command registry. A consumer may
adopt a specialist interaction library and style it with the shared tokens.
There is no requirement to rebuild a complex control to preserve the core's
zero-dependency property.

Publishing on `npm` remains a distribution mechanism. Marketing, a theme
marketplace, and a design-tool workflow are not objectives without a real task.
