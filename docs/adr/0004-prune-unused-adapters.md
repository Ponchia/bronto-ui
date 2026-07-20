# 0004. Prune unused adapter and controlled-modal surfaces

Status: accepted

## Context

Bronto UI is CSS-first and framework-agnostic. It also ships lifecycle wrappers
for React, Solid, Qwik, Svelte, and Vue, plus a controlled non-native modal
behavior. Package examples and tests prove those surfaces work, but an audit of
ten real consumers found no adapter imports and no `initModal()` initialization.

Maintaining each adapter multiplies every behavior change across five bindings,
types, examples, and matrix checks. The controlled modal duplicates native
`<dialog>` focus and stacking behavior while carrying a larger ownership model.
Neither cost is justified by downstream adoption.

## Decision

Deprecate the five framework adapter subpaths and `initModal()` in 0.7.0. Keep
them working unchanged for the complete 0.7 minor. Remove them no earlier than
0.8.0 under the project's deprecate-one-minor policy unless a real consumer
adopts a surface before removal.

Consumers initialize vanilla behaviors in their framework's normal mount and
cleanup lifecycle. Consumers use native `<dialog>` with `initDialog()` for modal
interaction.

## Consequences

- The canonical CSS and behavior layers remain framework-neutral.
- New behaviors no longer need to deepen an unadopted adapter surface.
- Existing adapter users have one full minor to migrate.
- Package examples continue proving compatibility during 0.7.
- A future adapter requires real adoption evidence, not catalog symmetry.
