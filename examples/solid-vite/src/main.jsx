import '@ponchia/ui';
import { render } from 'solid-js/web';
import { cls, useDialog, useDotGlyph, useTabs, useThemeToggle, useToast } from '@ponchia/ui/solid';
import { renderGlyph } from '@ponchia/ui/glyphs';
import { charts } from '@ponchia/ui/charts';
import { skins } from '@ponchia/ui/skins';

function App() {
  let rootEl;
  useThemeToggle(() => ({ root: rootEl }));
  useDialog(() => ({ root: rootEl }));
  useTabs(() => ({ root: rootEl }));
  useDotGlyph(() => ({ root: rootEl }));
  const toast = useToast();

  return (
    <main ref={rootEl} class="ui-center ui-stack" style={{ 'padding-block': '3rem' }}>
      <p class="ui-eyebrow">@ponchia/ui</p>
      <h1>Solid + Vite</h1>
      <div class="ui-cluster">
        <button class={cls.button} data-bronto-theme-toggle>
          Toggle theme
        </button>
        <button
          class="ui-button ui-button--subtle"
          type="button"
          onClick={() => toast('Hello from @ponchia/ui/solid', { tone: 'success' })}
        >
          Toast
        </button>
        <button class="ui-button ui-button--ghost" type="button" data-bronto-open="solidDlg">
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
        <section class="ui-tabs__panel" data-panel="two">
          <span innerHTML={renderGlyph('check-circle', { render: 'mask', label: 'check' })} />
        </section>
      </div>

      <p class="ui-muted">
        {charts.light.categorical.length} chart colours, {Object.keys(skins).length} skins.
      </p>

      <dialog id="solidDlg" class="ui-modal" data-bronto-dialog-light>
        <form method="dialog" class="ui-stack">
          <h2>Solid binding</h2>
          <p class="ui-muted">Dialog behavior is scoped to the Solid root resolver.</p>
          <button class={cls.button} data-bronto-close type="button">
            Close
          </button>
        </form>
      </dialog>
    </main>
  );
}

render(() => <App />, document.getElementById('root'));
