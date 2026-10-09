# First component: from install to a working page

Build a small status card using the same CSS classes as the [live, one-file example](../../demo/first-steps.html).
You can also [inspect its HTML source](https://github.com/Ponchia/bronto-ui/blob/main/demo/first-steps.html).
No JavaScript behavior is needed for this example.

## 1. Start a Vite project

If you already have an application, skip to the package installation and use its existing entry file.

```bash
npm create vite@latest bronto-first-steps -- --template vanilla
cd bronto-first-steps
npm install
npm install @ponchia/ui
```

## 2. Import the default stylesheet

Put this at the top of *main.js*, the file Vite already loads from *index.html*:

```js
import '@ponchia/ui';
```

This is a **CSS side-effect import**; it belongs in a bundler such as Vite.
Use explicit subpaths for JavaScript helpers, such as **@ponchia/ui/behaviors**.

## 3. Add a card

Replace the contents of *index.html* with:

```html
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bronto first steps</title>
  </head>
  <body>
    <main class="ui-container">
      <h1>Service overview</h1>
      <article class="ui-card">
        <span class="ui-eyebrow">Deployment</span>
        <h2>Production service</h2>
        <p>Infrastructure rollout completed and checks passed.</p>
        <span class="ui-badge ui-badge--success">Healthy</span>
      </article>
    </main>
    <script type="module" src="/main.js"></script>
  </body>
</html>
```

Run **npm run dev** and open the local URL Vite prints. The headings, content, and badge still make sense without CSS.

## 4. Check the important states

Try switching the root element to **data-theme="dark"**. Resize the browser to a phone width and tab through any links or controls you add.
Bronto UI owns styling and optional behaviors; your application still owns its state and data.

For a working project rather than a code excerpt, inspect the maintained [Vanilla Vite example](https://github.com/Ponchia/bronto-ui/tree/main/examples/vanilla-vite).
It builds from the packed npm package in the repository's CI example matrix.

## Next steps

- [Choose the right pattern](../usage.md) for your next task.
- [Browse compositions](../compositions.md) and [working examples](../../examples/).
- [Customize themes](../theming.md) with the accent token and root theme attributes.
- Plain HTML without a build step? Follow the [CDN and import-map guide](vanilla.md) instead.
- Migrating a consumer? Use the [upgrade checklist](upgrade.md).
