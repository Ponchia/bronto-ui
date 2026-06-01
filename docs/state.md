# Lifecycle & system state

`@ponchia/ui/css/state.css` is an opt-in vocabulary for the states real apps
spend their time in — saving, saved, queued, offline, stale, conflicted, locked,
reviewed. These are usually improvised per product, so even good apps feel
inconsistent. This is the canonical set: a labelled state object with a rationed
tone, plus a page/document sync bar.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/state.css';
```

Bronto ships the visual states and the canonical wording. The host owns the
state machine, retry policy, persistence, and announcements. **Persistent state
deserves persistent UI** — a toast is secondary, not the answer. The tone is a
second channel; the **label is the state**, so it survives forced-colors and
screen readers (WCAG 1.4.1).

## `.ui-state`

A leading tone dot, a `__label`, and an optional `__detail`. Add `--busy` to
pulse the indicator for an in-progress state (reduced-motion-safe).

```html
<span class="ui-state ui-state--saving ui-state--busy">
  <span class="ui-state__label">Saving…</span>
</span>

<span class="ui-state ui-state--saved">
  <span class="ui-state__label">Saved</span>
  <span class="ui-state__detail">2m ago</span>
</span>
```

## State matrix

Use the canonical label; the modifier bakes in the tone.

| State | Class | Canonical label | Tone | Busy? |
| --- | --- | --- | --- | --- |
| Saving | `ui-state--saving` | "Saving…" | accent | yes |
| Saved | `ui-state--saved` | "Saved" / "All changes saved" | success | — |
| Queued | `ui-state--queued` | "Queued" / "Pending" | muted | — |
| Offline | `ui-state--offline` | "Offline" | warning | — |
| Stale | `ui-state--stale` | "Out of date" | warning | — |
| Conflict | `ui-state--conflict` | "Conflict" | danger | — |
| Error | `ui-state--error` | "Failed" / "Couldn't save" | danger | — |
| Locked | `ui-state--locked` | "Locked" / "Read-only" | muted | — |
| Reviewed | `ui-state--reviewed` | "Reviewed" | success | — |
| Needs review | `ui-state--needs-review` | "Needs review" | warning | — |

"Syncing" and "Retrying" are the saving tone with their own label — use
`ui-state--saving ui-state--busy` and write the word.

## `.ui-syncbar`

A page- or document-level status strip: a state on one side, optional actions on
the other.

```html
<div class="ui-syncbar">
  <span class="ui-state ui-state--saved">
    <span class="ui-state__label">All changes saved</span>
    <span class="ui-state__detail">just now</span>
  </span>
  <button class="ui-button ui-button--subtle ui-button--sm" type="button">View history</button>
</div>
```

## Recipe

```js
import { ui } from '@ponchia/ui/classes';

ui.state({ state: 'saving', busy: true }); // "ui-state ui-state--saving ui-state--busy"
ui.state({ state: 'conflict' }); // "ui-state ui-state--conflict"
```

## Scope

CSS only — there is no JS yet. Auto-updating elapsed time ("2m ago") or live
progress text is the host's job; a small optional behavior may come later if a
real consumer needs it. Background-job progress and conflict-resolution
affordances are deliberately deferred until then.
