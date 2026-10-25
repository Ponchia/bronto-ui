# React and other framework lifecycles

Load `@ponchia/ui` once through a CSS-aware bundler. Import class recipes from
`@ponchia/ui/classes` and initializers from `@ponchia/ui/behaviors`. No framework
peer is required by the package.

## React

Initialize after the DOM ref exists. Return every cleanup; React's development
Strict Mode can mount, clean up, and mount the effect again.

```jsx
import '@ponchia/ui';
import { useEffect, useId, useRef } from 'react';
import { initDialog, initThemeToggle } from '@ponchia/ui/behaviors';

export function Settings() {
  const root = useRef(null);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;

  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const stopDialog = initDialog({ root: host });
    const stopTheme = initThemeToggle({ root: host });
    return () => {
      stopTheme();
      stopDialog();
    };
  }, []);

  return (
    <main ref={root} className="ui-stack">
      <button
        type="button"
        className="ui-button"
        data-bronto-open={dialogId}
        aria-haspopup="dialog"
        aria-controls={dialogId}
      >
        Open settings
      </button>
      <dialog id={dialogId} className="ui-modal" aria-labelledby={titleId}>
        <div className="ui-stack">
          <h2 id={titleId}>Display settings</h2>
          <p>Choose the theme for this application.</p>
          <button type="button" className="ui-button" data-bronto-theme-toggle>
            Dark theme
          </button>
          <button type="button" className="ui-button ui-button--ghost" data-bronto-close>
            Close settings
          </button>
        </div>
      </dialog>
    </main>
  );
}
```

The open button's `data-bronto-open` value matches the native dialog's ID;
`data-bronto-close` closes its enclosing dialog. `useId()` keeps these IDs
unique when more than one settings component is mounted. The heading supplies
the dialog's accessible name.

`initThemeToggle` reflects the dark-theme state through `aria-pressed` and
changes the theme on `<html>`, even though event handling is scoped to this
component. Use the before-paint script below if the persisted theme must apply
before React mounts.

Try the example with the keyboard: open settings, toggle **Dark theme**, and
press Escape or activate **Close settings**. The dialog should close and return
focus to **Open settings**. Mount and unmount the component under Strict Mode
to verify that the returned cleanup removes the behavior listeners.

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
