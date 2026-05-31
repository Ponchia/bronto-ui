# React / Solid

`@ponchia/ui` ships **no per-framework component package** — that is a
deliberate ADR (`docs/architecture.md`): the CSS is the framework and
the typed `cls`/`ui` recipes are already framework-agnostic. Only the
imperative behaviors need a lifecycle wrapper.

Since 0.4.0 those wrappers ship as **optional, thin bindings** —
`@ponchia/ui/react` and `@ponchia/ui/solid` (`react` / `solid-js` are
_optional_ peer deps). They're hooks over the same `init*` behaviors:

```tsx
// React
import { useDialog, useTabs, useToast, cls } from '@ponchia/ui/react';
function App() {
  useDialog(); // wires every .ui-modal under document; cleans up on unmount
  useTabs();
  const toast = useToast();
  return <button className={cls.button} onClick={() => toast('Saved', { tone: 'success' })}>Save</button>;
}
```

```tsx
// Solid — identical surface
import { useDialog, useToast } from '@ponchia/ui/solid';
function App() {
  useDialog();
  const toast = useToast();
  return <button class="ui-button" onClick={() => toast('Saved')}>Save</button>;
}
```

There's a `useX` for each behavior (`useDialog`, `useTabs`, `useMenu`,
`useCombobox`, `usePopover`, `useDisclosure`, `useFormValidation`,
`useTableSort`, `useCarousel`, `useDismissible`, `useThemeToggle`,
`useDotGlyph`), `useToast()` → the imperative, and the generic
`useBrontoBehavior(init, opts)`. Pass `{ root: ref.current }` to scope a
hook to a subtree. The hand-rolled equivalent below still works if you'd
rather not take the binding — it's exactly what the bindings do.

## CSS + no-flash theme

Import the CSS once at your root (`import '@ponchia/ui'`). For the
no-flash theme, put the inline script in your HTML shell — `index.html`
(Vite/CRA), or `app/layout.tsx` for Next via a raw `<script>` in
`<head>` with `dangerouslySetInnerHTML`:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `try{var t=localStorage.getItem('bronto-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`,
  }}
/>
```

It must be inline and render-blocking — a `useEffect` runs after paint
and will flash.

## React: a one-time behaviors hook

`init*` is idempotent and returns a cleanup, which maps exactly onto
`useEffect`. Note React 18 StrictMode mounts effects twice in dev —
idempotency + the returned cleanup make that safe:

```tsx
import { useEffect } from 'react';
import { initThemeToggle, initDialog, initTabs } from '@ponchia/ui/behaviors';

export function useBrontoBehaviors() {
  useEffect(() => {
    const stop = [initThemeToggle(), initDialog(), initTabs()];
    return () => stop.forEach((fn) => fn());
  }, []);
}
```

Call `useBrontoBehaviors()` once near the app root, after the markup it
wires is mounted. Use the typed classes for the markup itself:

```tsx
import { ui } from '@ponchia/ui/classes';
<button className={ui.button({ variant: 'ghost' })} data-bronto-theme-toggle />;
```

`toast(message, opts)` is import-and-call from any handler — no hook.

## Solid: `onMount` / `onCleanup`

```tsx
import { onMount, onCleanup } from 'solid-js';
import { initThemeToggle, initDialog } from '@ponchia/ui/behaviors';

onMount(() => {
  const stop = [initThemeToggle(), initDialog()];
  onCleanup(() => stop.forEach((fn) => fn()));
});
```

## SSR (Next / SolidStart)

`@ponchia/ui/behaviors` is side-effect-free on import and every `init*`
no-ops without a DOM, so importing it in a server-rendered module will
not crash. Keep the actual calls inside `useEffect` / `onMount` so they
only run client-side. The inline theme script is the only pre-paint
requirement.
