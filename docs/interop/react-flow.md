# React Flow interop

`@ponchia/ui` does not wrap or depend on React Flow / Xyflow. Use React Flow as
the renderer and keep graph state, layout, hit-testing, and node components in
the host application.

The one Bronto-specific gotcha is the base media reset:

```css
img,
svg {
  display: block;
  max-inline-size: 100%;
}
```

That reset is correct for normal inline SVGs, report figures, icons, and rendered
diagrams. React Flow edge SVGs are different: the edge layer uses absolutely
positioned SVG wrappers that paint by overflow. If `max-inline-size: 100%` is
allowed to constrain those wrappers, edges can disappear or clip.

## Edge SVG escape hatch

Scope the escape hatch to the React Flow surface in your app stylesheet. Keep it
un-layered, or place it in an app layer declared after `bronto`.

```css
/* app.css */
@import '@ponchia/ui';

.flow-surface .react-flow__edges svg,
.flow-surface .react-flow__edge svg {
  display: initial;
  max-inline-size: none;
  overflow: visible;
}
```

```tsx
import { ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export function GraphView() {
  return (
    <div className="flow-surface">
      <ReactFlow nodes={nodes} edges={edges} />
    </div>
  );
}
```

Do not remove Bronto's global SVG reset to fix this. The incompatibility is
specific to React Flow's edge-layer geometry, so the override should stay scoped
to the canvas.

## HTML edge labels

If you use React Flow's `EdgeLabelRenderer`, remember that labels are HTML
overlays, not SVG text. Container/group nodes can paint over them. Lift the label
overlay only inside the graph surface, and keep labels pointer-transparent unless
they are deliberately interactive:

```css
.flow-surface .react-flow__edgelabel-renderer {
  z-index: var(--z-raised, 10);
}

.flow-surface .flow-edge-label {
  pointer-events: none;
}
```

For dense operational diagrams, prefer sparse edge labels plus a side inspector
for detail. Use Bronto primitives inside nodes or inspectors (`ui-badge`,
`ui-dot`, `ui-property`, `ui-legend`) rather than adding a Bronto graph-node
component before a second consumer proves the pattern repeats.

## What belongs in the app

Keep these outside `@ponchia/ui`:

- authored or automatic node placement;
- graph data models and domain status names;
- brand/product icons;
- animation semantics, such as travelling reconciliation dots;
- click/hover selection behavior.

Bronto should provide the visual vocabulary and interop recipe. The graph
renderer and product meaning remain the host application's job.
