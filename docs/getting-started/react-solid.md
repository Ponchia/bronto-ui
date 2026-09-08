# React and other framework lifecycles

Load `@ponchia/ui` once through a CSS-aware bundler. Import class recipes from
`@ponchia/ui/classes` and initializers from `@ponchia/ui/behaviors`. No framework
peer is required by the package.

## React

Initialize after the DOM ref exists. Return every cleanup; React's development
Strict Mode can mount, clean up, and mount the effect again.

```jsx
import { useEffect, useRef } from 'react';
import { initDialog, initThemeToggle } from '@ponchia/ui/behaviors';

export function Settings() {
  const root = useRef(null);
  useEffect(() => {
    const stops = [
      initDialog({ root: root.current }),
      initThemeToggle({ root: root.current }),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);
  return (
    <main ref={root} className="ui-stack">
      <button className="ui-button" data-bronto-theme-toggle>Toggle theme</button>
    </main>
  );
}
```

Do not capture `root.current` during render and pass that initial null value
to an initializer later. Reinitialize behavior when replacing the markup it
indexes, and clean up the previous instance first. Keep application state in
React; do not initialize two interaction owners on the same control.

The [packed example](../../examples/react-vite) verifies mounting, scoped
events, and cleanup. Next.js components that call these initializers belong
on the client side. The CSS and server-rendered markup do not require a
client component solely for styling.

## Solid

Use `onMount` after the root is assigned, and register cleanup with `onCleanup`.

```jsx
import { onMount, onCleanup } from 'solid-js';
import { initDialog } from '@ponchia/ui/behaviors';

export function Panel() {
  let root;
  onMount(() => {
    const stop = initDialog({ root });
    onCleanup(stop);
  });
  return <main ref={root} class="ui-stack" />;
}
```

## Qwik

Initialize DOM-dependent behavior in the framework's visible-task lifecycle,
after its signal ref is assigned, and register the returned cleanup. Qwik owns
resumability and component state. Bronto does not ship a Qwik wrapper or promise
that imperative DOM wiring is free of eager client work.

Solid and Qwik are integration patterns, not maintained packed examples in the
current consumer matrix. The supported package contract is the same CSS and
vanilla behavior surface in every framework.

## Theme and accessibility

Use the [integration guide](../integration.md) for the before-paint theme
script. Native dialog markup needs an accessible name. Use real buttons and
the documented ARIA relationships; class names alone do not supply semantics.
