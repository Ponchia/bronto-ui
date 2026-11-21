# Vanilla Vite: build the evidence workspace

This project contains two pages built from the public `@ponchia/ui` package:

- `/workspace.html` is the complete [evidence workspace](https://ponchia.github.io/bronto-ui/examples/workspace/): select an observation, inspect its source, record a local review, change theme, and print the result.
- `/` is the small theme-and-toast integration example.

## Copy and run

Use Node.js **22.23.4 or a newer 22.x release**, npm, and Git. These commands
use a POSIX shell and new directories for the source download and your project:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/Ponchia/bronto-ui.git bronto-ui-source
git -C bronto-ui-source sparse-checkout set examples/vanilla-vite
cp -R bronto-ui-source/examples/vanilla-vite bronto-workspace
cd bronto-workspace
npm install
npm run dev
```

Open the local URL Vite prints and append **`/workspace.html`**. For example,
if Vite reports `http://localhost:5173/`, open
`http://localhost:5173/workspace.html`. The root URL opens the theme-and-toast
page.

The copied directory is an independent application. Its `package.json`
declares a published `@ponchia/ui` dependency, and `npm install` obtains that
package from npm. Copy the entire directory so the Vite configuration and both
HTML entry points travel with the source files.

If you already have a clean Bronto UI checkout, you can copy its
`examples/vanilla-vite` directory into a new project directory and run the same
install and development commands there.

## Files and public imports

| File | Responsibility |
| --- | --- |
| [`package.json`](package.json) | Published UI dependency, Vite, and the `dev`, `build`, and `preview` commands. |
| [`workspace.html`](workspace.html) | Semantic workspace markup, static fallback values, stylesheet link, and module entry. |
| [`src/workspace-evidence.css`](src/workspace-evidence.css) | Public stylesheet imports followed by the host's responsive layout and print rules. |
| [`src/workspace-evidence.mjs`](src/workspace-evidence.mjs) | Sample observations, selection, local review state, SVG drawing, and behavior lifecycle. |
| [`index.html`](index.html) and [`src/main.js`](src/main.js) | The small theme-and-toast example. |

The workspace stylesheet loads the core and four opt-in leaves:

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/workbench.css';
@import '@ponchia/ui/css/figure.css';
@import '@ponchia/ui/css/sources.css';
@import '@ponchia/ui/css/state.css';
```

The controller imports `initToolbar`, `initThemeToggle`, `initActionMenu`,
`initDialog`, `initCombobox`, and `initPopover` from `@ponchia/ui/behaviors`,
and `readTokens` and `observeTokens` from `@ponchia/ui/renderer`. These are
public package exports. Vite resolves the installed package and bundles the
selected styles and JavaScript.

## Initialization and cleanup

`workspace.html` loads its stylesheet before the module script. The module
runs after the workspace markup exists, calls the behavior initializers,
and wires the host's own selection, action, and review handlers. Importing a
behavior alone does not activate the corresponding controls.

The supplied `paintChart` function owns SVG drawing. Its initial paint reads
the current tokens before observing subsequent appearance changes:

```js
paintChart(readTokens());
const stopTokens = observeTokens(paintChart);
```

`observeTokens()` does not call the renderer on initial setup. Keep its stop
function with the cleanup functions returned by the behavior initializers.
When embedding this composition in a router or framework, call those cleanups
and remove the host's listeners when the view is disposed; initialize again
after mounting replacement markup.

The included controller already handles Vite hot replacement and real page
teardown. It keeps the controls and token observer alive when a `pagehide`
event has `persisted: true`, so returning through the browser's back/forward
cache restores a working page. Its static HTML table and source remain useful
when JavaScript is disabled.

## Try the complete review

1. Select **Smaller batch**. The figure, data table, and captured source all
   describe the same 96 ms synthetic observation.
2. Select **Repeat run**, open **Review decision**, and choose **Wait for an
   observed result**. Record the review. The receipt changes while the result
   remains **Unknown** and its latency remains **Not observed**.
3. Open the review again and use its next-step choices and evidence-scope
   popover with the keyboard. Escape closes the active inner control before
   the surrounding dialog, and closing the dialog returns focus to its opener.
4. Switch the theme. The SVG follows the resolved colors alongside the HTML
   interface. Resize to a narrow window and tab through the controls.
5. Use **Print brief**. The selected result, fallback table, source, and
   evidence qualifications remain in the printed document.
6. Reload the page. The local review decisions reset.

The observations are authored sample data. A review is a decision about that
data; it does not create a measurement or change an unknown result into
verified evidence. Reviews live only in the current page session. The example
does not execute operations or persist decisions to a service.

For your own application, replace the sample observations and initial static
HTML together so the fallback content agrees with the interactive view. Keep
source identity, capture time, and uncertainty beside the result. Your
application owns data fetching, permissions, persistence, and command
execution. Bronto supplies the shared styles and interaction contracts.

## Build and check

From the copied project directory:

```bash
npx --no-install bronto-ui-check index.html workspace.html src
npm run build
npm run preview
```

Open `/workspace.html` at the preview URL Vite prints. The production build
contains both pages. The installed markup checker validates literal Bronto
class and token names; follow it with the keyboard, theme, narrow-layout, and
print checks above.

In Bronto UI's repository CI, the packed-example runner substitutes the
candidate tarball for the published dependency and checks both entries. The
public website's workspace demo is generated from these same workspace files.
Read the [composition guide](https://ponchia.github.io/bronto-ui/docs/compositions.html#workspace-evidence-review)
for how the inspector, figure, source, and review fit together.
