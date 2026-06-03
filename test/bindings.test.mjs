import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
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

// End-to-end: a REAL hook drives a REAL behavior to a DOM effect (not just a
// stub init). useDisclosure delegates from document and toggles the trigger's
// aria-expanded + the panel's hidden on click — a pure mutation (no node
// removal, so it won't fight the framework's ownership), jsdom-supported, so
// we prove the full hook → behavior → DOM path for both frameworks.
test('React useDisclosure wires the real behavior end-to-end', async () => {
  const host = mount();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const [{ createElement, act }, { createRoot }, { useDisclosure }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('../react/index.js'),
  ]);
  function App() {
    useDisclosure();
    return createElement(
      'div',
      null,
      createElement(
        'button',
        {
          type: 'button',
          id: 'trig',
          'data-bronto-disclosure': '',
          'aria-controls': 'panel',
          'aria-expanded': 'false',
        },
        'Toggle',
      ),
      createElement('div', { id: 'panel', hidden: true }, 'Panel'),
    );
  }
  const root = createRoot(host);
  await act(async () => root.render(createElement(App)));
  assert.equal(document.getElementById('panel').hidden, true, 'panel starts hidden');
  await act(async () => {
    document
      .getElementById('trig')
      .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
  assert.equal(document.getElementById('trig').getAttribute('aria-expanded'), 'true');
  assert.equal(document.getElementById('panel').hidden, false, 'useDisclosure opened the panel');
  await act(async () => root.unmount());
});

test('Solid useDisclosure wires the real behavior end-to-end', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { JSDOM } from 'jsdom';
    const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
      url: 'https://bronto.test/', pretendToBeVisual: true,
    });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.Node = dom.window.Node;
    globalThis.CustomEvent = dom.window.CustomEvent;
    const [{ render }, { useDisclosure }] = await Promise.all([
      import('solid-js/web'), import('./solid/index.js'),
    ]);
    function App() {
      useDisclosure();
      const wrap = document.createElement('div');
      wrap.innerHTML = '<button type="button" id="trig" data-bronto-disclosure aria-controls="panel" aria-expanded="false">Toggle</button><div id="panel" hidden>Panel</div>';
      return wrap;
    }
    const dispose = render(App, document.getElementById('app'));
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(document.getElementById('panel').hidden, true, 'panel starts hidden');
    document.getElementById('trig').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    assert.equal(document.getElementById('trig').getAttribute('aria-expanded'), 'true');
    assert.equal(document.getElementById('panel').hidden, false, 'useDisclosure opened the panel');
    dispose();
    dom.window.close();
  `;
  execFileSync(process.execPath, ['--conditions=browser', '--input-type=module', '-e', script], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
});

// Qwik binding. A full render-through-Qwik is proven by building
// examples/qwik-vite through the real optimizer (CI examples job); here we
// assert the module surface and that the hooks are genuinely wired to Qwik's
// client lifecycle (not silent no-ops) — deterministic, no optimizer needed.
test('binding hook surface is identical across react/solid/qwik (derived, cannot go stale)', async () => {
  const [react, solid, qwik] = await Promise.all([
    import('../react/index.js'),
    import('../solid/index.js'),
    import('../qwik/index.js'),
  ]);
  // Derive the hook set from each module rather than hard-coding it — a new
  // behavior gets a `use*` hook in all three or this fails (moa caught the old
  // hard-coded list silently missing the five analytical hooks).
  const surface = (m) =>
    Object.keys(m)
      .filter((k) => /^use[A-Z]/.test(k))
      .sort();
  const reactHooks = surface(react);
  assert.ok(reactHooks.length >= 18, `expected the full hook surface, got ${reactHooks.length}`);
  assert.deepEqual(surface(solid), reactHooks, 'solid hook surface matches react');
  assert.deepEqual(surface(qwik), reactHooks, 'qwik hook surface matches react');

  // COVERAGE, not just agreement: the three agreeing with each other can't catch
  // a NEW behavior that none of them wrapped. Derive the expected hooks from the
  // behaviors barrel itself — every `initX` export must have a `useX` in all
  // three bindings — so a 19th behavior with no binding hook fails here. (The
  // imperative `toast` / one-shot `applyStoredTheme` are not `init*` and so are
  // intentionally not required as lifecycle hooks; `useToast` is asserted above.)
  const barrel = await import('../behaviors/index.js');
  const expectedHooks = Object.keys(barrel)
    .filter((k) => /^init[A-Z]/.test(k))
    .map((k) => `use${k.slice(4)}`)
    .sort();
  for (const [name, m] of [
    ['react', react],
    ['solid', solid],
    ['qwik', qwik],
  ]) {
    const have = new Set(surface(m));
    const missing = expectedHooks.filter((h) => !have.has(h));
    assert.deepEqual(
      missing,
      [],
      `${name} bindings missing hooks for barrel behaviors: ${missing.join(', ')}`,
    );
  }

  // Every hook is a real function and the convenience exports are present in all three.
  for (const m of [react, solid, qwik]) {
    for (const name of reactHooks) assert.equal(typeof m[name], 'function', `${name} exported`);
    for (const name of ['applyStoredTheme', 'cls', 'ui', 'cx', 'useToast'])
      assert.ok(m[name], `convenience export ${name} present`);
  }

  // useToast() is the SSR-safe imperative: returns toast(), which no-ops to a
  // cleanup function when there is no DOM (no global document in this test).
  const toast = qwik.useToast();
  assert.equal(typeof toast, 'function');
  assert.equal(typeof toast('hi'), 'function');
});

test('Qwik lifecycle hooks are real useVisibleTask$ wirings (throw outside a component)', async () => {
  const { useDialog } = await import('../qwik/index.js');
  // useVisibleTask$ asserts it runs inside a component invocation context;
  // calling the hook bare must throw Qwik's context error — proof the hook
  // delegates to Qwik's lifecycle rather than no-op'ing.
  assert.throws(() => useDialog(), /./);
});

// Extract a top-level `function NAME(...) {...}` body as source text by brace
// matching. The resolver helpers contain no braces inside strings/comments, so
// a plain depth count is exact here.
function fnSource(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start === -1) return null;
  let depth = 0;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  return null;
}

test('binding resolver helpers do not drift (resolveMaybe/resolveOpts identical; resolveRoot react=solid)', () => {
  // The hook-surface test above proves the three bindings expose the same hooks;
  // it does NOT prove the resolver helper *bodies* agree. resolveMaybe/resolveOpts
  // are byte-identical across all three, so drift in one is a real bug — assert it.
  const dir = dirname(fileURLToPath(import.meta.url));
  const read = (b) => readFileSync(resolve(dir, '..', b, 'index.js'), 'utf8');
  const [react, solid, qwik] = [read('react'), read('solid'), read('qwik')];

  for (const fn of ['resolveMaybe', 'resolveOpts']) {
    const ref = fnSource(react, fn);
    assert.ok(ref, `react ${fn} found`);
    assert.equal(fnSource(solid, fn), ref, `solid ${fn} matches react`);
    assert.equal(fnSource(qwik, fn), ref, `qwik ${fn} matches react`);
  }

  // resolveRoot is identical react↔solid; qwik DELIBERATELY also unwraps a Qwik
  // signal (`value`), so it must differ. Assert both halves so a react/solid
  // drift is caught without flagging the intentional qwik delta.
  const rootRef = fnSource(react, 'resolveRoot');
  assert.ok(rootRef, 'react resolveRoot found');
  assert.equal(fnSource(solid, 'resolveRoot'), rootRef, 'solid resolveRoot matches react');
  assert.notEqual(
    fnSource(qwik, 'resolveRoot'),
    rootRef,
    'qwik resolveRoot intentionally differs (signal unwrap)',
  );
});
