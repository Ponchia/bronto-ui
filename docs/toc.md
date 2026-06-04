# Table of contents (scrollspy)

`@ponchia/ui/css/toc.css` is an opt-in **sticky contents rail** for long
generated reports. The entry for the section currently in view is highlighted, so
a reader always knows where they are. It degrades to a plain anchored list with
zero JavaScript.

```css
@import '@ponchia/ui';
@import '@ponchia/ui/css/toc.css';
```

## How it behaves

- The rail sticks within its scroll container (`--toc-top` sets the inset).
- The active entry keys on the standard `aria-current="true"` hook — the same
  rule every other nav surface here uses.
- Nested lists indent for sub-sections.

## Wiring — the host mirrors the in-view section

CSS alone cannot know which section is on screen, so the host sets
`aria-current="true"` on the link for the current section. Two ways:

1. **Static** — server-render `aria-current` on the section you're rendering a
   "current page" for. No script at all.
2. **Live scrollspy** — a tiny `IntersectionObserver` (~15 lines, copy-paste
   below) mirrors the in-view section onto its link. No Bronto kernel ships for
   this; the rail is fully useful as a static sticky list without it.

```html
<nav class="ui-toc" aria-label="Contents">
  <p class="ui-toc__title">Contents</p>
  <ul class="ui-toc__list">
    <li><a class="ui-toc__link" href="#intro" aria-current="true">Introduction</a></li>
    <li><a class="ui-toc__link" href="#method">Method</a></li>
    <li><a class="ui-toc__link" href="#results">Results</a></li>
  </ul>
</nav>
```

```js
// Optional live scrollspy — mirror the in-view section onto its TOC link.
const links = new Map(
  [...document.querySelectorAll('.ui-toc__link')].map((a) => [a.hash.slice(1), a]),
);
const spy = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      for (const a of links.values()) a.removeAttribute('aria-current');
      links.get(e.target.id)?.setAttribute('aria-current', 'true');
    }
  },
  { rootMargin: '0px 0px -70% 0px' },
);
for (const id of links.keys()) {
  const section = document.getElementById(id);
  if (section) spy.observe(section);
}
```

## Class reference

| Class            | Role                                                       |
| ---------------- | ---------------------------------------------------------- |
| `.ui-toc`        | The sticky contents rail (`<nav>`).                        |
| `.ui-toc__title` | Optional eyebrow heading for the rail.                     |
| `.ui-toc__list`  | The list of entries (`<ul>`/`<ol>`; nests for sub-sections). |
| `.ui-toc__link`  | An entry link; `aria-current="true"` marks the active one. |

| Custom property | On        | Meaning                                                       |
| --------------- | --------- | ------------------------------------------------------------- |
| `--toc-top`     | `.ui-toc` | Sticky inset from the top of the scroll container (default `var(--space-md)`). |

## Accessibility & robustness

- The active cue is repainted with the system highlight under `forced-colors`,
  so it survives high-contrast mode.
- Wrap the rail in a `<nav aria-label="Contents">` so it is announced as a
  navigation landmark.
- Without the optional observer the rail is a normal anchored list — every link
  still jumps to its section.
