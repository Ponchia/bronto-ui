import '@ponchia/ui';
import { component$, render, useSignal } from '@builder.io/qwik';
import { cls, useDialog, useDotGlyph, useTabs, useThemeToggle, useToast } from '@ponchia/ui/qwik';
import { renderGlyph } from '@ponchia/ui/glyphs';
import { charts } from '@ponchia/ui/charts';
import { skins } from '@ponchia/ui/skins';

const App = component$(() => {
  // A Qwik signal scopes the delegated behaviors to this subtree; the hooks
  // read it inside useVisibleTask$, after the ref is assigned.
  const root = useSignal();
  useThemeToggle({ root });
  useDialog({ root });
  useTabs({ root });
  useDotGlyph({ root });
  const toast = useToast();

  return (
    <main ref={root} class="ui-center ui-stack" style={{ paddingBlock: '3rem' }}>
      <p class="ui-eyebrow">@ponchia/ui</p>
      <h1>Qwik + Vite</h1>
      <div class="ui-cluster">
        <button class={cls.button} data-bronto-theme-toggle>
          Toggle theme
        </button>
        <button
          class="ui-button ui-button--subtle"
          type="button"
          onClick$={() => toast('Hello from @ponchia/ui/qwik', { tone: 'success' })}
        >
          Toast
        </button>
        <button class="ui-button ui-button--ghost" type="button" data-bronto-open="qwikDlg">
          Open dialog
        </button>
      </div>

      <div data-bronto-tabs class="ui-tabs">
        <div class="ui-tabs__list" aria-label="Example tabs">
          <button class="ui-tab is-active" data-tab="one" type="button">
            One
          </button>
          <button class="ui-tab" data-tab="two" type="button">
            Two
          </button>
        </div>
        <section class="ui-tabs__panel" data-panel="one">
          <span data-bronto-glyph="spark" data-bronto-glyph-label="spark" />
        </section>
        <section
          class="ui-tabs__panel"
          data-panel="two"
          dangerouslySetInnerHTML={renderGlyph('check-circle', { render: 'mask', label: 'check' })}
        />
      </div>

      <p class="ui-muted">
        {charts.light.categorical.length} chart colours, {Object.keys(skins).length} skins.
      </p>

      <dialog id="qwikDlg" class="ui-modal" data-bronto-dialog-light>
        <form method="dialog" class="ui-stack">
          <h2>Qwik binding</h2>
          <p class="ui-muted">Dialog behavior is scoped to the Qwik root signal.</p>
          <button class={cls.button} data-bronto-close type="button">
            Close
          </button>
        </form>
      </dialog>
    </main>
  );
});

render(document.getElementById('root'), <App />);
