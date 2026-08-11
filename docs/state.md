# Lifecycle & system state

`@ponchia/ui/css/state.css` is an opt-in vocabulary for the states real apps
spend their time in — saving, saved, queued, offline, stale, conflicted, locked,
reviewed, and background work still running after the initiating interaction is
gone. These are usually improvised per product, so even good apps feel
inconsistent. This is the canonical set: a labelled state object with a rationed
tone, a page/document sync bar, and a persistent background-job row.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/state.css';
```

Bronto ships the visual states and the canonical wording. The host owns the
state machine, retry policy, persistence, cancellation, and announcements.
**Persistent state deserves persistent UI** — a toast is secondary, not the
answer. The tone is a second channel; the **label is the state**, so it
survives forced-colors and screen readers (WCAG 1.4.1).

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

## `.ui-job`

A durable row for background jobs, imports, exports, sync runs, and pipelines.
It is deliberately not a task runner: the host owns polling, retry/cancel
semantics, queue position, partial failures, and completion messages. Bronto
paints a persistent status/progress object so long-running work is not hidden in
a transient toast.

```html
<article
  class="ui-job ui-job--running"
  style="--job-progress: 64%"
  aria-labelledby="job-title"
>
  <div class="ui-job__head">
    <h3 class="ui-job__title" id="job-title">Importing listings</h3>
    <span class="ui-state ui-state--saving ui-state--busy">
      <span class="ui-state__label">Running</span>
      <span class="ui-state__detail">64%</span>
    </span>
  </div>
  <p class="ui-job__body">124 of 194 records processed. Latest checkpoint saved.</p>
  <div
    class="ui-job__progress"
    role="progressbar"
    aria-label="Import progress"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow="64"
  >
    <span class="ui-job__bar"></span>
  </div>
  <div class="ui-job__actions">
    <button class="ui-button ui-button--subtle ui-button--sm" type="button">View log</button>
    <button class="ui-button ui-button--ghost ui-button--sm" type="button">Cancel</button>
  </div>
</article>
```

Use the written state as the source of truth:

| State | Class | Typical label | Use when… |
| --- | --- | --- | --- |
| Queued | `ui-job--queued` | "Queued" | The job is accepted but not running yet. |
| Running | `ui-job--running` | "Running" / "Syncing" | Work is actively progressing. |
| Blocked | `ui-job--blocked` | "Blocked" / "Waiting" | Work cannot proceed without another system or user action. |
| Failed | `ui-job--failed` | "Failed" | The job stopped and needs retry, inspection, or acknowledgement. |
| Complete | `ui-job--complete` | "Complete" | Work finished and the result is available. |

For determinate jobs, set `--job-progress` as a percentage on `.ui-job` and
put `role="progressbar"` plus `aria-valuenow/min/max` on `.ui-job__progress`.
For indeterminate jobs, omit the progress block or omit `aria-valuenow`, and
make the written state clear ("Running", "Waiting for worker", "Retrying").
Use `ui-job--compact` for dense queues.

## Severity — `.ui-severity`

`.ui-state` answers *what is this thing doing*. Severity answers *how bad is
it*. Bronto already shipped the tones as per-component modifiers, but never the
**scale** — the tier names, their order, and the attribute carrying them. So
every consumer invents the ladder, and inside one app it drifts: one surface
saying `critical|error|warning|note`, the next `bad|warn`, a third
`critical|warning|info|ok`, under two different attribute names. Findings then
do not sort against alerts, and a filter written for one list misses the other.

The ladder, worst to best:

| Level | Means |
| --- | --- |
| `critical` | Broken now, and still losing something. |
| `error` | Something failed; it is not currently getting worse. |
| `warning` | A threshold was crossed; nothing has failed yet. |
| `notice` | Worth reading, no action implied. |
| `ok` | Checked and healthy — an **assertion**, not the absence of news. |
| `unknown` | Not measured, stale, or the check itself failed. |

`unknown` sits **outside** the ordering on purpose. It is not "slightly worse
than ok", it is "we do not know" — and collapsing it into `ok` is how a dead
collector reads as a healthy system. `SEVERITY_LEVELS` therefore excludes it.

The level travels on `data-level`, one attribute name, so the same selector
works on a chip, a row, a dot, or your own element via `var(--severity-tone)`:

```html
<span class="ui-severity" data-level="critical">Critical</span>

<li class="ui-severity-row" data-level="warning">
  <span class="ui-severity-row__title">Disk 84% on kpi-1</span>
  <span class="ui-severity-row__meta">12m</span>
</li>
```

Colour is never the only channel (WCAG 1.4.1): `.ui-severity` carries an
author-written label, and `.ui-severity-dot` is only for rows that **also** name
their level in text.

## Recipe

```js
import { ui, severity, SEVERITY_LEVELS } from '@ponchia/ui/classes';

ui.state({ state: 'saving', busy: true }); // "ui-state ui-state--saving ui-state--busy"
ui.state({ state: 'conflict' }); // "ui-state ui-state--conflict"
ui.job({ state: 'running' }); // "ui-job ui-job--running"

// Bundles the class WITH data-level, so the attribute that carries the meaning
// cannot be forgotten — the class alone paints the neutral tone and silently
// loses the level.
severity('critical'); // { class: 'ui-severity', 'data-level': 'critical' }
severity('warning', { part: 'row' }); // { class: 'ui-severity-row', … }
severity('nope'); // { class: 'ui-severity', 'data-level': 'unknown' }

SEVERITY_LEVELS; // ['critical','error','warning','notice','ok'] — sort/filter from this
```

## Scope

CSS only — there is no JS yet. Auto-updating elapsed time ("2m ago"), live
progress text, polling, cancellation, retry, and conflict-resolution affordances
are the host's job. A small optional behavior may come later if a real consumer
needs it.

## Related

Use the [reporting toolbox](./reporting.md#the-analytical-toolbox-in-a-report)
to place `state.css` in report surfaces, and use
[reference.md](./reference.md) for the generated class catalog.
