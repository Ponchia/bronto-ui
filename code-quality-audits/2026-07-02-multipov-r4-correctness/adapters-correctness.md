# Framework adapters — bronto-ui correctness review
**Verdict:** No P0/P1 adapter breaks found, but React/Solid/Qwik have a real one-shot lifecycle hole: late roots and changed options can leave behavior permanently stale. Vue has a smaller update identity bug. Svelte’s action lifecycle looked correct.

## Confirmed defects
- **[P2] [conf HIGH]** `react/index.js:105` — React hook ignores changed options and late scoped refs.
  - Failure scenario: `useThemeToggle({ storageKey })`, then change `storageKey` state from `theme-a` to `theme-b`; clicks still write `theme-a`. Also reproduced `useBrontoBehavior(..., { root: ref })` where the ref target is rendered after first effect: init sees `root:null` and never retries.
  - Fix direction: do not add raw `opts` to deps. Add an explicit dependency/rebind API, e.g. `useBrontoBehavior(init, opts, deps)` and wrapper deps, so callers pass `[storageKey]` / `[rootReady]`.

- **[P2] [conf HIGH]** `solid/index.js:107` — Solid resolver/signal options are read only once in `onMount`.
  - Failure scenario: `useThemeToggle(() => ({ storageKey: key() }))`; after `key()` changes, the listener still persists under the old key. Also reproduced a signal-backed root that is `null` at mount and later becomes an element: the behavior remains unwired.
  - Fix direction: use `createEffect` around `resolveOpts(opts)` so Solid signal reads track naturally, and register previous-run cleanup with `onCleanup`.

- **[P2] [conf MED]** `qwik/index.js:110` — Qwik unwraps signal roots without `ctx.track`, so late signal roots/options do not re-run the visible task.
  - Failure scenario: `const root = useSignal(); useDialog({ root })`, with the rooted subtree rendered after the first visible task. `resolveRoot` reads `root.value` once, emits `root:null`, and no later `root.value` assignment triggers a rebind.
  - Fix direction: pass `ctx.track` into Qwik option resolution and track Qwik signal roots before calling `init`; keep cleanup registered through `ctx.cleanup`.

- **[P3] [conf MED]** `vue/index.js:108` — Vue directive update skips same-object option mutations.
  - Failure scenario: mount with `const opts = { root: first }`, then mutate `opts.root = second` and receive `updated(el, { value: opts, oldValue: opts })`; the identity guard returns early, so cleanup/re-init never happens and the old root stays active.
  - Fix direction: store the previous resolved option signature per element/directive key and compare `root`/`storageKey`, rather than comparing binding object identity.

## Lower-confidence / needs-repro
- **[P3] [conf LOW]** `qwik/index.d.ts:45` — Qwik types still accept function option resolvers, but Qwik serialization rejects captured plain functions. Docs recommend signals; the type surface should probably narrow Qwik to serializable opts or QRL-backed resolvers.

## Notable (not a bug)
- React StrictMode double-invoke is handled: the effect returns the behavior cleanup and behavior idempotency makes the dev remount safe.
- Svelte actions re-run on `update` and clean up on `destroy`; I did not find a Svelte-only adapter defect.
- Qwik’s shared `start()` helper is not itself the issue; the issue is untracked signal reads / non-serializable resolver inputs.