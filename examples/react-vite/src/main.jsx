import '@ponchia/ui';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cls } from '@ponchia/ui/classes';
import { initDialog, initDotGlyph, initTabs, initThemeToggle, toast } from '@ponchia/ui/behaviors';
import { renderGlyph } from '@ponchia/ui/glyphs';
import { charts } from '@ponchia/ui/charts';
import { skins } from '@ponchia/ui/skins';

function App() {
  const rootRef = useRef(null);
  const [bindingsEnabled, setBindingsEnabled] = useState(true);
  useEffect(() => {
    if (!bindingsEnabled) return;
    const root = rootRef.current;
    const stops = [
      initThemeToggle({ root }),
      initDialog({ root }),
      initTabs({ root }),
      initDotGlyph({ root }),
    ];
    return () => stops.forEach((stop) => stop());
  }, [bindingsEnabled]);

  return (
    <main ref={rootRef} className="ui-center ui-stack" style={{ paddingBlock: '3rem' }}>
      <button hidden data-bindings-disable type="button" onClick={() => setBindingsEnabled(false)}>
        Disable bindings
      </button>
      <span hidden data-bindings-state>
        {bindingsEnabled ? 'enabled' : 'disabled'}
      </span>
      <p className="ui-eyebrow">@ponchia/ui</p>
      <h1>React + Vite</h1>
      <div className="ui-cluster">
        <button className={cls.button} data-bronto-theme-toggle>
          Toggle theme
        </button>
        <button
          className="ui-button ui-button--subtle"
          type="button"
          onClick={() => toast('Hello from React', { tone: 'success' })}
        >
          Toast
        </button>
        <button className="ui-button ui-button--ghost" type="button" data-bronto-open="reactDlg">
          Open dialog
        </button>
      </div>

      <div data-bronto-tabs className="ui-tabs">
        <div className="ui-tabs__list" aria-label="Example tabs">
          <button className="ui-tab is-active" data-tab="one" type="button">
            One
          </button>
          <button className="ui-tab" data-tab="two" type="button">
            Two
          </button>
        </div>
        <section className="ui-tabs__panel" data-panel="one">
          <span data-bronto-glyph="spark" data-bronto-glyph-label="spark" />
        </section>
        <section className="ui-tabs__panel" data-panel="two">
          <span
            dangerouslySetInnerHTML={{
              __html: renderGlyph('check-circle', { render: 'mask', label: 'check' }),
            }}
          />
        </section>
      </div>

      <p className="ui-muted">
        {charts.light.categorical.length} chart colours, {Object.keys(skins).length} skins.
      </p>

      <dialog
        id="reactDlg"
        className="ui-modal"
        data-bronto-dialog-light
        aria-label="React example dialog"
      >
        <form method="dialog" className="ui-stack">
          <h2>React lifecycle</h2>
          <p className="ui-muted">Dialog behavior is scoped to the React root ref.</p>
          <button className={cls.button} data-bronto-close type="button">
            Close
          </button>
        </form>
      </dialog>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
