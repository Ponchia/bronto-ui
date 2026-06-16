# React / Solid / Qwik

`@ponchia/ui` ships **no per-framework component package** — that is a
deliberate ADR (`docs/architecture.md`): the CSS is the framework and
the typed `cls`/`ui` recipes are already framework-agnostic. Only the
imperative behaviors need a lifecycle wrapper.

Since 0.4.0 those wrappers ship as **optional, thin bindings** —
`@ponchia/ui/react`, `@ponchia/ui/solid` and `@ponchia/ui/qwik`
(`react` / `solid-js` / `@builder.io/qwik` are _optional_ peer deps).
They're hooks over the same `init*` behaviors:

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
`useTableSort`, `useCarousel`, `useDismissible`, `useDisabledGuard`,
`useThemeToggle`, `useDotGlyph`, `useLegend`, `useConnectors`, `useSpotlight`,
`useCrosshair`, `useCommand`, `useSources`, `useSplitter`, `useModal`), `useToast()` → the
imperative, and the generic `useBrontoBehavior(init, opts)`. To scope a hook to a subtree, pass a
React ref object (`{ root: ref }`) or a resolver callback (`() => ({
root: el })`). The bindings resolve options on mount, after refs have
been assigned; the ref/resolver timing was hardened in 0.4.1. Avoid
`{ root: ref.current }` in React render code because that captures the first
render's `null`. The hand-rolled equivalent below still works if you'd rather
not take the binding — it's exactly what the bindings do.

## CSS + no-flash theme

Import the CSS once at your root (`import '@ponchia/ui'`) when your
bundler understands CSS side-effect imports. For the
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

When using the shipped React bindings, scope by passing the ref object:

```tsx
import { useRef } from 'react';
import { useDialog, useTabs } from '@ponchia/ui/react';

export function Screen() {
  const root = useRef<HTMLElement | null>(null);
  useDialog({ root });
  useTabs({ root });
  return <main ref={root}>{/* dialog/tab markup */}</main>;
}
```

`root` scopes which delegated controls are wired. Controlled targets such as
dialogs, disclosures, and popovers resolve root-first, then document-wide so
body/portal-mounted overlays keep working.

## Solid: `onMount` / `onCleanup`

```tsx
import { onMount, onCleanup } from 'solid-js';
import { initThemeToggle, initDialog } from '@ponchia/ui/behaviors';

onMount(() => {
  const stop = [initThemeToggle(), initDialog()];
  onCleanup(() => stop.forEach((fn) => fn()));
});
```

With the shipped Solid bindings, use a resolver so the element assignment
is read on mount:

```tsx
import { useDialog, useTabs } from '@ponchia/ui/solid';

let root!: HTMLElement;
useDialog(() => ({ root }));
useTabs(() => ({ root }));

<main ref={root}>{/* dialog/tab markup */}</main>;
```

## Qwik: `useVisibleTask$`

`@ponchia/ui/qwik` (peer dep `@builder.io/qwik`) wraps each behavior in a
`useVisibleTask$` — it runs when the owning component first becomes visible
and registers cleanup on dispose, so a resumable, server-rendered page stays
zero-JS until the user reaches that part of the UI. Same hook names as the
React/Solid bindings:

```tsx
import { component$, useSignal } from '@builder.io/qwik';
import { useDialog, useTabs, useToast, cls } from '@ponchia/ui/qwik';

export default component$(() => {
  const root = useSignal<HTMLElement>();
  useDialog({ root }); // scope to this subtree via a Qwik signal
  useTabs({ root });
  const toast = useToast();
  return (
    <main ref={root}>
      <button class={cls.button} onClick$={() => toast('Saved', { tone: 'success' })}>
        Save
      </button>
      {/* dialog/tab markup */}
    </main>
  );
});
```

Scope with a **Qwik signal** (`useSignal()`) rather than a function resolver:
the signal is serializable, so the optimizer can lift the `useVisibleTask$`
segment cleanly. The hand-rolled equivalent is a `useVisibleTask$` that calls
the `init*` behavior and returns its cleanup via `ctx.cleanup(...)` — which is
exactly what the binding does. The no-flash theme script is the same inline,
render-blocking `<script>` in your root document (Qwik City: `src/root.tsx`).

## SSR (Next / SolidStart)

`@ponchia/ui/behaviors` is side-effect-free on import and every `init*`
no-ops without a DOM, so importing it in a server-rendered module will
not crash. Keep the actual calls inside `useEffect` / `onMount` so they
only run client-side. The inline theme script is the only pre-paint
requirement.

**Next.js (App Router).** Three rules:

1. Import the CSS once in `app/layout.tsx` (`import '@ponchia/ui'`) and set
   `<html data-theme>` defensively with the **inline, render-blocking** no-flash
   script (a `useEffect` runs after paint and flashes):

   ```tsx
   // app/layout.tsx (a Server Component — no 'use client')
   import '@ponchia/ui';
   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en" suppressHydrationWarning>
         <head>
           <script
             dangerouslySetInnerHTML={{
               __html: `try{var t=localStorage.getItem('bronto-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`,
             }}
           />
         </head>
         <body>{children}</body>
       </html>
     );
   }
   ```

   `suppressHydrationWarning` on `<html>` silences the expected
   server-vs-client `data-theme` mismatch (the server can't know the user's
   stored theme).

2. The hooks touch the DOM, so any component calling one must be a Client
   Component — put `'use client'` at the top of that file. The markup itself
   (`<dialog class="ui-modal">`, `.ui-tabs`, …) can stay in Server Components;
   only the component that calls `useDialog()`/`useTabs()` needs the directive.

3. `@ponchia/ui/react` (and `/behaviors`) are ESM-only — Next's bundler handles
   them natively; no `transpilePackages` needed.

**SolidStart** is the same shape: CSS + inline theme script in the root
document, hooks (`onMount`-based) run client-side automatically.
