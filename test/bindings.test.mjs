import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

let dom;

function mount() {
  dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'https://bronto.test/',
    pretendToBeVisual: true,
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.CustomEvent = dom.window.CustomEvent;
  return dom.window.document.getElementById('app');
}

afterEach(() => {
  dom?.window?.close();
  for (const k of [
    'window',
    'document',
    'HTMLElement',
    'Node',
    'CustomEvent',
    'IS_REACT_ACT_ENVIRONMENT',
  ]) {
    delete globalThis[k];
  }
  dom = undefined;
});

test('React binding resolves ref roots after mount and cleans up on unmount', async () => {
  const host = mount();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const [{ createElement, useRef, act }, { createRoot }, { useBrontoBehavior }] = await Promise.all(
    [import('react'), import('react-dom/client'), import('../react/index.js')],
  );
  const calls = [];

  function Probe() {
    const ref = useRef(null);
    useBrontoBehavior(
      (opts) => {
        calls.push(opts?.root?.id);
        return () => calls.push('cleanup');
      },
      { root: ref },
    );
    useBrontoBehavior(
      (opts) => {
        calls.push(opts === undefined ? 'undefined' : 'unexpected');
      },
      () => null,
    );
    return createElement('section', { id: 'scoped-react', ref });
  }

  const root = createRoot(host);
  await act(async () => root.render(createElement(Probe)));
  assert.deepEqual(calls, ['scoped-react', 'undefined']);

  await act(async () => root.unmount());
  assert.deepEqual(calls, ['scoped-react', 'undefined', 'cleanup']);
});

test('Solid binding resolves callback roots after mount and cleans up on dispose', async () => {
  const script = `
    import assert from 'node:assert/strict';
    import { JSDOM } from 'jsdom';
    const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
      url: 'https://bronto.test/',
      pretendToBeVisual: true,
    });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.Node = dom.window.Node;
    globalThis.CustomEvent = dom.window.CustomEvent;
    const [{ render }, { useBrontoBehavior }] = await Promise.all([
      import('solid-js/web'),
      import('./solid/index.js'),
    ]);
    const calls = [];
    function Probe() {
      const el = document.createElement('section');
      el.id = 'scoped-solid';
      useBrontoBehavior(
        (opts) => {
          calls.push(opts?.root?.id);
          return () => calls.push('cleanup');
        },
        () => ({ root: el }),
      );
      useBrontoBehavior((opts) => {
        calls.push(opts === undefined ? 'undefined' : 'unexpected');
      }, () => null);
      return el;
    }
    const dispose = render(Probe, document.getElementById('app'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(calls, ['scoped-solid', 'undefined']);
    dispose();
    assert.deepEqual(calls, ['scoped-solid', 'undefined', 'cleanup']);
    dom.window.close();
  `;
  execFileSync(process.execPath, ['--conditions=browser', '--input-type=module', '-e', script], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
});
