# React / Solid

`@ponchia/ui` ships **no per-framework component package** — that is a
deliberate ADR (`docs/architecture.md`): the CSS is the framework and
the typed `cls`/`ui` recipes are already framework-agnostic. Only the
imperative behaviors need a lifecycle wrapper, and it is small enough to
copy. This page is that copy-paste.

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
