import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { awaitDemoReady } from './_demo.mjs';

const resolved = JSON.parse(
  readFileSync(new URL('../../tokens/resolved.json', import.meta.url), 'utf8'),
);

/**
 * Engine-agnostic behavioural assertions (no pixels) — runs on
 * chromium + firefox + webkit, since the real cross-browser risk for a
 * CSS-first framework is `:has()`, `color-mix()`, native <dialog>,
 * `:dir()` and logical properties behaving differently per engine.
 */

async function open(page, theme = 'dark') {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('bronto-theme', t);
    } catch {
      /* sandboxed storage — falls back to OS, still deterministic here */
    }
  }, theme);
  await page.goto('/demo/', { waitUntil: 'networkidle' });
  await awaitDemoReady(page); // behaviors (table sort, …) are wired by index.js
  await page.evaluate(() => document.fonts.ready);
}

async function openBehaviorSandbox(page) {
  await page.goto('/behaviors/index.js', { waitUntil: 'domcontentloaded' });
  await page.setContent('<!doctype html><html><body></body></html>');
}

test('RTL actually mirrors interactive controls (not just box model)', async ({ page }) => {
  await open(page);
  const sel = '.ui-switch input:checked + .ui-switch__track .ui-switch__thumb';
  const read = () =>
    page.evaluate((s) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform);
      const bg = getComputedStyle(document.querySelector('.ui-select')).backgroundPositionX;
      return { tx: m.m41, bg };
    }, sel);

  const ltr = await read();
  expect(ltr.tx).toBeGreaterThan(0); // checked thumb moves toward inline-end

  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  // Wait for the mirrored end-state rather than racing the transition.
  await page.waitForFunction(
    (s) => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform).m41 < 0,
    sel,
  );
  const rtl = await read();
  expect(rtl.tx).toBeLessThan(0); // …and mirrors under RTL
  expect(rtl.bg).not.toBe(ltr.bg); // select marker flips side too
});

test('native <dialog> open/close glue works (initDialog)', async ({ page }) => {
  await open(page);
  const dialog = page.locator('dialog.ui-modal#demoModal');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Open modal' }).click();
  await expect(dialog).toBeVisible();
  // Backdrop light-dismiss (opted in via data-bronto-dialog-light).
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
});

test('native <dialog> glue cancels handled defaults and ignores text-node clicks', async ({
  page,
}) => {
  await page.goto('/package.json');
  await page.setContent(`
    <a id="missing" href="#missing" data-bronto-open="missing">Missing dialog</a>
    <a id="open" href="#jump" data-bronto-open="dlg">Open dialog</a>
    <dialog id="dlg" data-bronto-dialog-light>
      <a id="close" href="#close" data-bronto-close>Close dialog</a>
    </dialog>
    <span id="text-target">plain text</span>
  `);
  await page.addScriptTag({
    type: 'module',
    content: `
    import { initDialog } from '/behaviors/index.js';
    window.__dialogErrors = [];
    window.addEventListener('error', (event) => window.__dialogErrors.push(event.message));
    window.__dialogStop = initDialog();
    window.__dialogReady = true;
    `,
  });
  await page.waitForFunction(() => window.__dialogReady === true);

  const result = await page.evaluate(() => {
    const dlg = document.getElementById('dlg');
    const click = (target) => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const allowed = target.dispatchEvent(event);
      return { allowed, defaultPrevented: event.defaultPrevented };
    };

    const missing = click(document.getElementById('missing'));
    const open = click(document.getElementById('open'));
    const openAfterOpen = dlg.open;
    const text = click(document.getElementById('text-target').firstChild);
    const close = click(document.getElementById('close'));
    const openAfterClose = dlg.open;
    click(document.getElementById('open'));
    const light = click(dlg);

    return {
      missing,
      open,
      openAfterOpen,
      text,
      close,
      openAfterClose,
      light,
      openAfterLight: dlg.open,
      errors: window.__dialogErrors,
    };
  });

  expect(result.missing).toEqual({ allowed: true, defaultPrevented: false });
  expect(result.open).toEqual({ allowed: false, defaultPrevented: true });
  expect(result.openAfterOpen).toBe(true);
  expect(result.text).toEqual({ allowed: true, defaultPrevented: false });
  expect(result.close).toEqual({ allowed: false, defaultPrevented: true });
  expect(result.openAfterClose).toBe(false);
  expect(result.light).toEqual({ allowed: false, defaultPrevented: true });
  expect(result.openAfterLight).toBe(false);
  expect(result.errors).toEqual([]);
});

test('theme toggle updates the root theme in a real browser', async ({ page }) => {
  await open(page, 'light');
  const root = page.locator('html');
  const toggle = page.locator('[data-bronto-theme-toggle]');
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await toggle.click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  await toggle.click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

test('dismissible removes the nearest dismissible host in a real browser', async ({ page }) => {
  await open(page);
  const alert = page.locator('.ui-alert[data-bronto-dismissible]');
  await expect(alert).toBeVisible();
  await alert.locator('[data-bronto-dismiss]').click();
  await expect(alert).toHaveCount(0);
});

test('disclosure and dismissible cancel handled defaults and clean up in a real browser', async ({
  page,
}) => {
  await openBehaviorSandbox(page);
  const result = await page.evaluate(async () => {
    const wrap = document.createElement('section');
    wrap.id = 'default-cleanup-fixture';
    wrap.innerHTML = `
      <a id="disclosure-trigger" href="#native" data-bronto-disclosure aria-controls="panel" aria-expanded="true">Toggle</a>
      <div id="panel">Panel</div>
      <div id="dismiss-box" data-bronto-dismissible><a id="dismiss-link" href="#dismiss" data-bronto-dismiss>Dismiss</a></div>
      <a id="dismiss-noop" href="#noop" data-bronto-dismiss="[[bad">Noop</a>
    `;
    document.body.append(wrap);
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initDisclosure, dismissible } = await import(behaviorPath);

    const stopDisclosure = initDisclosure({ root: wrap });
    const trigger = document.getElementById('disclosure-trigger');
    const panel = document.getElementById('panel');
    const disclosureClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    const disclosureAllowed = trigger.dispatchEvent(disclosureClick);
    const disclosureAfterClick = {
      allowed: disclosureAllowed,
      defaultPrevented: disclosureClick.defaultPrevented,
      expanded: trigger.getAttribute('aria-expanded'),
      hidden: panel.hidden,
    };
    stopDisclosure();
    const disclosureAfterCleanup = {
      expanded: trigger.getAttribute('aria-expanded'),
      hiddenAttr: panel.getAttribute('hidden'),
    };

    const stopDismissible = dismissible({ root: wrap });
    const dismissClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    const dismissAllowed = document.getElementById('dismiss-link').dispatchEvent(dismissClick);
    const noopClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    const noopAllowed = document.getElementById('dismiss-noop').dispatchEvent(noopClick);
    stopDismissible();
    wrap.remove();

    return {
      disclosureAfterClick,
      disclosureAfterCleanup,
      dismiss: {
        allowed: dismissAllowed,
        defaultPrevented: dismissClick.defaultPrevented,
        removed: !document.getElementById('dismiss-box'),
      },
      noop: {
        allowed: noopAllowed,
        defaultPrevented: noopClick.defaultPrevented,
      },
    };
  });

  expect(result.disclosureAfterClick).toEqual({
    allowed: false,
    defaultPrevented: true,
    expanded: 'false',
    hidden: true,
  });
  expect(result.disclosureAfterCleanup).toEqual({ expanded: 'true', hiddenAttr: null });
  expect(result.dismiss).toEqual({ allowed: false, defaultPrevented: true, removed: true });
  expect(result.noop).toEqual({ allowed: true, defaultPrevented: false });
});

test('delegated handlers resolve text-node clicks and cancel handled defaults in a real browser', async ({
  page,
}) => {
  await openBehaviorSandbox(page);
  const result = await page.evaluate(async () => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.removeItem('bronto-text-target-theme');
    const wrap = document.createElement('section');
    wrap.id = 'delegated-text-target-fixture';
    wrap.innerHTML = `
      <a id="theme-link" href="#native-theme" data-bronto-theme-toggle aria-pressed="mixed">Theme</a>

      <div id="tabs-text" class="ui-tabs" data-bronto-tabs>
        <div class="ui-tabs__list">
          <a id="tab-alpha" href="#alpha-native" class="ui-tab is-active" data-tab="alpha">Alpha</a>
          <a id="tab-beta" href="#beta-native" class="ui-tab" data-tab="beta">Beta</a>
        </div>
        <div id="panel-alpha" class="ui-tabs__panel" data-panel="alpha">Alpha panel</div>
        <div id="panel-beta" class="ui-tabs__panel" data-panel="beta">Beta panel</div>
      </div>

      <div id="command-text" class="ui-command" data-bronto-command>
        <input class="ui-command__input" aria-label="Command" />
        <ul class="ui-command__list">
          <li class="ui-command__item" data-value="home"><span>Home</span></li>
          <li id="command-settings" class="ui-command__item" data-value="settings"><span>Settings</span></li>
        </ul>
      </div>

      <main id="sources-text" data-bronto-sources>
        <button id="source-button" type="button" data-bronto-source-ref="source-two">Source two</button>
        <article id="source-two" class="ui-source-card">
          <h3 class="ui-source-card__title">Source title</h3>
        </article>
      </main>

      <button id="dead-button" aria-disabled="true"><span>Dead action</span></button>
    `;
    document.body.append(wrap);

    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initCommand, initDisabledGuard, initSources, initTabs, initThemeToggle } = await import(
      behaviorPath
    );
    const stops = [
      initThemeToggle({ root: wrap, storageKey: 'bronto-text-target-theme' }),
      initTabs({ root: wrap }),
      initCommand({ root: wrap }),
      initSources({ root: wrap }),
      initDisabledGuard({ root: wrap }),
    ];
    const click = (target) => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const allowed = target.dispatchEvent(event);
      return { allowed, defaultPrevented: event.defaultPrevented };
    };

    let commandDetail = null;
    let sourceDetail = null;
    let disabledTargetFired = 0;
    document.getElementById('command-text').addEventListener('bronto:command:select', (event) => {
      commandDetail = event.detail;
    });
    document.getElementById('sources-text').addEventListener('bronto:source:focus', (event) => {
      sourceDetail = event.detail.id;
    });
    document.getElementById('dead-button').addEventListener('click', () => {
      disabledTargetFired += 1;
    });

    const themeClick = click(document.getElementById('theme-link').firstChild);
    const tabsClick = click(document.getElementById('tab-beta').firstChild);
    const commandClick = click(
      document.getElementById('command-settings').querySelector('span').firstChild,
    );
    const sourceClick = click(document.getElementById('source-button').firstChild);
    const disabledClick = click(
      document.getElementById('dead-button').querySelector('span').firstChild,
    );

    const beforeCleanup = {
      theme: {
        click: themeClick,
        rootTheme: document.documentElement.getAttribute('data-theme'),
        ariaPressed: document.getElementById('theme-link').getAttribute('aria-pressed'),
        stored: localStorage.getItem('bronto-text-target-theme'),
      },
      tabs: {
        click: tabsClick,
        betaSelected: document.getElementById('tab-beta').getAttribute('aria-selected'),
        betaPanelHidden: document.getElementById('panel-beta').hidden,
        alphaPanelHidden: document.getElementById('panel-alpha').hidden,
      },
      command: {
        click: commandClick,
        detail: commandDetail,
      },
      source: {
        click: sourceClick,
        detail: sourceDetail,
        activeElement: document.activeElement?.id,
      },
      disabled: {
        click: disabledClick,
        fired: disabledTargetFired,
      },
    };

    stops.forEach((stop) => stop());
    const afterCleanup = {
      themeAria: document.getElementById('theme-link').getAttribute('aria-pressed'),
      betaRole: document.getElementById('tab-beta').getAttribute('role'),
      betaSelected: document.getElementById('tab-beta').getAttribute('aria-selected'),
      commandRole: document.getElementById('command-settings').getAttribute('role'),
      sourceTabindex: document.getElementById('source-two').getAttribute('tabindex'),
    };
    wrap.remove();
    return { beforeCleanup, afterCleanup };
  });

  expect(result.beforeCleanup.theme).toEqual({
    click: { allowed: false, defaultPrevented: true },
    rootTheme: 'dark',
    ariaPressed: 'true',
    stored: 'dark',
  });
  expect(result.beforeCleanup.tabs).toEqual({
    click: { allowed: false, defaultPrevented: true },
    betaSelected: 'true',
    betaPanelHidden: false,
    alphaPanelHidden: true,
  });
  expect(result.beforeCleanup.command).toEqual({
    click: { allowed: true, defaultPrevented: false },
    detail: { value: 'settings', label: 'Settings' },
  });
  expect(result.beforeCleanup.source).toEqual({
    click: { allowed: false, defaultPrevented: true },
    detail: 'source-two',
    activeElement: 'source-two',
  });
  expect(result.beforeCleanup.disabled).toEqual({
    click: { allowed: false, defaultPrevented: true },
    fired: 0,
  });
  expect(result.afterCleanup).toEqual({
    themeAria: 'mixed',
    betaRole: null,
    betaSelected: null,
    commandRole: null,
    sourceTabindex: null,
  });
});

test('native menu behavior closes details on Escape and outside click', async ({ page }) => {
  await open(page);
  const menu = page.locator('[data-bronto-menu]');
  const summary = menu.locator('summary');

  await summary.click();
  await expect(menu).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open', '');

  await summary.click();
  await expect(menu).toHaveAttribute('open', '');
  await page.mouse.click(4, 4);
  await expect(menu).not.toHaveAttribute('open', '');
});

test('native menu behavior supports root-scoped outside click and owns Escape in dialogs', async ({
  page,
}) => {
  await openBehaviorSandbox(page);
  await page.evaluate(async () => {
    document.body.innerHTML = `
      <details id="root-menu" data-bronto-menu open>
        <summary>Root menu</summary>
        <div class="ui-menu"><button class="ui-menu__item" id="root-item">Action</button></div>
      </details>
      <button id="outside-menu">Outside</button>
    `;
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initMenu } = await import(behaviorPath);
    window.__rootMenuStop = initMenu({ root: document.getElementById('root-menu') });
  });

  await page.locator('#outside-menu').click();
  await expect(page.locator('#root-menu')).toHaveJSProperty('open', false);
  await page.evaluate(() => window.__rootMenuStop?.());

  await page.evaluate(async () => {
    document.body.innerHTML = `
      <dialog id="menu-dialog">
        <details id="dialog-menu" data-bronto-menu open>
          <summary id="dialog-menu-summary">Dialog menu</summary>
          <div class="ui-menu"><button class="ui-menu__item" id="dialog-menu-item">Action</button></div>
        </details>
      </dialog>
    `;
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initMenu } = await import(behaviorPath);
    window.__dialogMenuStop = initMenu({ root: document.getElementById('menu-dialog') });
    document.getElementById('menu-dialog').showModal();
    document.getElementById('dialog-menu-item').focus();
  });

  await page.keyboard.press('Escape');
  await expect(page.locator('#dialog-menu')).toHaveJSProperty('open', false);
  await expect(page.locator('#menu-dialog')).toHaveJSProperty('open', true);
  await expect(page.locator('#dialog-menu-summary')).toBeFocused();
  await page.evaluate(() => {
    window.__dialogMenuStop?.();
    document.getElementById('menu-dialog')?.close();
  });
});

test('tabs cleanup restores generated APG state in a real browser', async ({ page }) => {
  await open(page);
  await page.evaluate(async () => {
    const wrap = document.createElement('section');
    wrap.innerHTML = `
      <div id="tabs-cleanup" class="ui-tabs" data-bronto-tabs>
        <div class="ui-tabs__list">
          <button type="button" class="ui-tab is-active" data-tab="a">Alpha</button>
          <button type="button" class="ui-tab" data-tab="b">Beta</button>
        </div>
        <div class="ui-tabs__panel" data-panel="a">Alpha panel</div>
        <div class="ui-tabs__panel" data-panel="b">Beta panel</div>
      </div>`;
    document.body.append(wrap);
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initTabs } = await import(behaviorPath);
    window.__tabsCleanupStop = initTabs({ root: document.getElementById('tabs-cleanup') });
  });

  const group = page.locator('#tabs-cleanup');
  const list = group.locator('.ui-tabs__list');
  const alpha = group.locator('[data-tab="a"]');
  const beta = group.locator('[data-tab="b"]');
  const alphaPanel = group.locator('[data-panel="a"]');
  const betaPanel = group.locator('[data-panel="b"]');

  await expect(list).toHaveAttribute('role', 'tablist');
  await beta.click();
  await expect(beta).toHaveAttribute('aria-selected', 'true');
  await expect(alphaPanel).toBeHidden();
  await expect(betaPanel).toBeVisible();

  await page.evaluate(() => window.__tabsCleanupStop());
  await expect(list).not.toHaveAttribute('role', /.+/);
  await expect(alpha).toHaveClass(/is-active/);
  await expect(beta).not.toHaveClass(/is-active/);
  await expect(alpha).not.toHaveAttribute('id', /.+/);
  await expect(beta).not.toHaveAttribute('role', /.+/);
  await expect(beta).not.toHaveAttribute('aria-selected', /.+/);
  await expect(beta).not.toHaveAttribute('aria-controls', /.+/);
  await expect(alphaPanel).toBeVisible();
  await expect(betaPanel).toBeVisible();
  await expect(alphaPanel).not.toHaveAttribute('role', /.+/);
  await expect(betaPanel).not.toHaveAttribute('aria-labelledby', /.+/);

  await beta.click();
  await expect(alpha).toHaveClass(/is-active/);
  await expect(beta).not.toHaveClass(/is-active/);
});

test('controlled modal and aria-disabled guard work in a real browser', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const wrap = document.createElement('section');
    wrap.innerHTML = `
      <button id="controlled-open">Open controlled modal</button>
      <aside id="controlled-bg"><a href="#background">Background link</a></aside>
      <div id="controlled-modal" class="ui-modal" data-bronto-modal aria-label="Controlled modal">
        <button id="controlled-ok">OK</button>
      </div>
      <button id="dead-control" aria-disabled="true">Dead action</button>
      <button id="live-control">Live action</button>`;
    document.body.append(wrap);
  });
  await page.addScriptTag({
    type: 'module',
    content: `
    import { initModal, initDisabledGuard } from '/behaviors/index.js';

    const modal = document.getElementById('controlled-modal');
    window.__controlledModalCloseRequests = 0;
    window.__deadClicks = 0;
    window.__liveClicks = 0;
    document.getElementById('controlled-open').addEventListener('click', () => {
      modal.classList.add('is-open');
    });
    modal.addEventListener('bronto:modal:close', () => {
      window.__controlledModalCloseRequests += 1;
      modal.classList.remove('is-open');
    });
    document.getElementById('dead-control').addEventListener('click', () => {
      window.__deadClicks += 1;
    });
    document.getElementById('live-control').addEventListener('click', () => {
      window.__liveClicks += 1;
    });
    window.__controlledStops = [initModal(), initDisabledGuard()];
    window.__controlledReady = true;
    `,
  });
  await page.waitForFunction(() => window.__controlledReady === true);

  await page.locator('#controlled-open').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#controlled-modal')).toHaveClass(/is-open/);
  await expect(page.locator('#controlled-ok')).toBeFocused();
  await expect.poll(() => page.locator('#controlled-bg').evaluate((el) => el.inert)).toBe(true);

  await page.keyboard.press('Escape');
  await expect(page.locator('#controlled-modal')).not.toHaveClass(/is-open/);
  await expect(page.locator('#controlled-open')).toBeFocused();
  await expect.poll(() => page.locator('#controlled-bg').evaluate((el) => el.inert)).toBe(false);
  expect(await page.evaluate(() => window.__controlledModalCloseRequests)).toBe(1);

  await page.evaluate(() => {
    const dead = document.getElementById('dead-control');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    window.__deadClickDefaultPrevented = !dead.dispatchEvent(event) || event.defaultPrevented;
  });
  await page.locator('#dead-control').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.__deadClicks)).toBe(0);
  expect(await page.evaluate(() => window.__deadClickDefaultPrevented)).toBe(true);

  await page.locator('#live-control').focus();
  await expect(page.locator('#live-control')).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__liveClicks)).toBe(1);
});

test('controlled modal cleanup restores generated state and Escape stays topmost', async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => {
    const cleanupStage = document.createElement('section');
    cleanupStage.id = 'modal-cleanup-stage';
    cleanupStage.innerHTML = `
      <button id="modal-cleanup-opener">Open content modal</button>
      <aside id="modal-cleanup-bg"><a href="#modal-cleanup-bg">Background</a></aside>
      <div id="modal-cleanup-panel" class="ui-modal is-open" data-bronto-modal aria-label="Content modal"></div>
    `;
    document.body.append(cleanupStage);
    document.getElementById('modal-cleanup-opener').focus();
  });
  await page.addScriptTag({
    type: 'module',
    content: `
    import { initModal } from '/behaviors/index.js';
    window.__modalCleanupStop = initModal({ root: document.getElementById('modal-cleanup-stage') });
    window.__modalCleanupReady = true;
    `,
  });
  await page.waitForFunction(() => window.__modalCleanupReady === true);

  const cleanupPanel = page.locator('#modal-cleanup-panel');
  await expect(cleanupPanel).toHaveAttribute('role', 'dialog');
  await expect(cleanupPanel).toHaveAttribute('aria-modal', 'true');
  await expect(cleanupPanel).toHaveAttribute('tabindex', '-1');
  await expect.poll(() => page.locator('#modal-cleanup-bg').evaluate((el) => el.inert)).toBe(true);

  await page.evaluate(() => {
    window.__detachedModalCleanupPanel = document.getElementById('modal-cleanup-panel');
    window.__detachedModalCleanupPanel.remove();
    window.__modalCleanupStop();
  });
  await expect.poll(() => page.locator('#modal-cleanup-bg').evaluate((el) => el.inert)).toBe(false);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        role: window.__detachedModalCleanupPanel.getAttribute('role'),
        ariaModal: window.__detachedModalCleanupPanel.getAttribute('aria-modal'),
        tabindex: window.__detachedModalCleanupPanel.getAttribute('tabindex'),
      })),
    )
    .toEqual({ role: null, ariaModal: null, tabindex: null });

  await page.evaluate(() => {
    const stackStage = document.createElement('section');
    stackStage.id = 'modal-stack-stage';
    stackStage.innerHTML = `
      <button id="modal-stack-opener">Open stacked modals</button>
      <div id="modal-outer" class="ui-modal is-open" data-bronto-modal aria-label="Outer">
        <button id="modal-outer-ok">Outer ok</button>
        <div id="modal-inner" class="ui-modal is-open" data-bronto-modal aria-label="Inner">
          <button id="modal-inner-ok">Inner ok</button>
        </div>
      </div>
    `;
    document.body.append(stackStage);
    window.__modalOuterCloseRequests = 0;
    window.__modalInnerCloseRequests = 0;
    document.getElementById('modal-outer').addEventListener('bronto:modal:close', (event) => {
      if (event.target.id === 'modal-outer') window.__modalOuterCloseRequests += 1;
    });
    document.getElementById('modal-inner').addEventListener('bronto:modal:close', (event) => {
      if (event.target.id === 'modal-inner') window.__modalInnerCloseRequests += 1;
    });
    document.getElementById('modal-stack-opener').focus();
  });
  await page.addScriptTag({
    type: 'module',
    content: `
    import { initModal } from '/behaviors/index.js';
    window.__modalStackStop = initModal({ root: document.getElementById('modal-stack-stage') });
    window.__modalStackReady = true;
    `,
  });
  await page.waitForFunction(() => window.__modalStackReady === true);

  await expect(page.locator('#modal-inner-ok')).toBeFocused();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__modalInnerCloseRequests)).toBe(1);
  expect(await page.evaluate(() => window.__modalOuterCloseRequests)).toBe(0);

  await page.evaluate(() => document.getElementById('modal-inner').classList.remove('is-open'));
  await expect(page.locator('#modal-outer-ok')).toBeFocused();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__modalOuterCloseRequests)).toBe(1);
  await page.evaluate(() => window.__modalStackStop());
});

test('Escape on a popover nested in a <dialog> closes only the popover, not the dialog', async ({
  page,
}) => {
  // Regression: without preventDefault()/stopPropagation() in initPopover's
  // Escape handler, one keypress closed BOTH — hidePopover() ran, then the
  // browser's close-request found the dialog as the new topmost element and
  // dismissed it too. The doc contract is "popover + dialog open together".
  await open(page);
  await page.evaluate(() => {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <button id="c3-open" data-bronto-open="c3-dlg">open</button>
      <dialog id="c3-dlg" class="ui-modal">
        <button id="c3-trig" data-bronto-popover="c3-pop">pop</button>
        <div id="c3-pop" class="ui-popover" popover aria-label="nested popover">hi</div>
      </dialog>`;
    document.body.appendChild(wrap);
  });
  await page.click('#c3-open');
  await expect(page.locator('#c3-dlg')).toBeVisible();
  await page.click('#c3-trig');
  const isOpen = (id) =>
    page.evaluate((i) => {
      const el = document.getElementById(i);
      return el.matches(':popover-open') || el.classList.contains('is-open');
    }, id);
  await expect.poll(() => isOpen('c3-pop')).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => isOpen('c3-pop')).toBe(false); // popover closes
  await expect(page.locator('#c3-dlg')).toBeVisible(); // …dialog stays open
});

test('native popover branch uses the top layer and syncs UA toggles', async ({ page }) => {
  await page.goto('/package.json');
  await page.setContent(`
    <button id="native-trigger" data-bronto-popover="native-pop">Info</button>
    <div id="native-pop" class="ui-popover" popover aria-label="Native details">
      <button id="native-focus">Focusable</button>
    </div>`);
  await page.evaluate(async () => {
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initPopover } = await import(behaviorPath);
    window.__nativePopoverStop = initPopover();
  });

  const trigger = page.locator('#native-trigger');
  const panel = page.locator('#native-pop');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.click();
  await expect.poll(() => panel.evaluate((el) => el.matches(':popover-open'))).toBe(true);
  await expect(panel).not.toHaveClass(/is-open/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  await panel.evaluate((el) => el.hidePopover());
  await expect.poll(() => panel.evaluate((el) => el.matches(':popover-open'))).toBe(false);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await page.evaluate(() => {
    window.__nativePopoverStop();
    const trigger = document.getElementById('native-trigger');
    trigger.setAttribute('aria-expanded', 'sentinel');
  });
  await trigger.click();
  await expect.poll(() => panel.evaluate((el) => el.matches(':popover-open'))).toBe(false);
  await expect(trigger).toHaveAttribute('aria-expanded', 'sentinel');
  await panel.evaluate((el) => {
    el.showPopover();
    el.hidePopover();
  });
  await expect(trigger).toHaveAttribute('aria-expanded', 'sentinel');
});

test('popover cleanup restores generated trigger and panel state in a real browser', async ({
  page,
}) => {
  await page.goto('/package.json');
  await page.setContent(`
    <button id="popover-cleanup-trigger" data-bronto-popover="popover-cleanup-panel">
      Details
    </button>
    <div id="popover-cleanup-panel" class="ui-popover" aria-label="Details">Plain text</div>
  `);
  await page.evaluate(async () => {
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initPopover } = await import(behaviorPath);
    window.__popoverCleanupStop = initPopover();
  });

  const trigger = page.locator('#popover-cleanup-trigger');
  const panel = page.locator('#popover-cleanup-panel');
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(trigger).toHaveAttribute('aria-controls', 'popover-cleanup-panel');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.click();
  await expect(panel).toHaveClass(/is-open/);
  await expect(panel).toHaveAttribute('role', 'dialog');
  await expect(panel).toHaveAttribute('tabindex', '-1');
  await expect.poll(() => panel.evaluate((el) => el.style.maxBlockSize)).not.toBe('');

  await page.evaluate(() => {
    window.__detachedPopoverCleanupPanel = document.getElementById('popover-cleanup-panel');
    window.__detachedPopoverCleanupPanel.remove();
    window.__popoverCleanupStop();
  });
  await expect(trigger).not.toHaveAttribute('aria-haspopup', /.+/);
  await expect(trigger).not.toHaveAttribute('aria-controls', /.+/);
  await expect(trigger).not.toHaveAttribute('aria-expanded', /.+/);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const panel = window.__detachedPopoverCleanupPanel;
        return {
          isOpen: panel.classList.contains('is-open'),
          left: panel.style.left,
          maxBlockSize: panel.style.maxBlockSize,
          role: panel.getAttribute('role'),
          tabindex: panel.getAttribute('tabindex'),
          top: panel.style.top,
        };
      }),
    )
    .toEqual({
      isOpen: false,
      left: '',
      maxBlockSize: '',
      role: null,
      tabindex: null,
      top: '',
    });
});

test('native popover branch keeps tall panels inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 500, height: 360 });
  await page.goto('/package.json');
  await page.setContent(`
    <link rel="stylesheet" href="/dist/bronto.css" />
    <button
      id="tall-trigger"
      data-bronto-popover="tall-pop"
      style="position: fixed; inset-block-start: 300px; inset-inline-start: 230px"
    >
      Details
    </button>
    <div id="tall-pop" class="ui-popover" popover aria-label="Tall details">
      <button>Focusable</button>
      <div style="block-size: 420px; inline-size: 14rem">Tall content</div>
    </div>`);
  await page.evaluate(async () => {
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initPopover } = await import(behaviorPath);
    window.__tallPopoverStop = initPopover();
  });

  await page.locator('#tall-trigger').click();
  const geometry = await page.evaluate(() => {
    const trigger = document.getElementById('tall-trigger');
    const panel = document.getElementById('tall-pop');
    const rect = panel.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const style = getComputedStyle(panel);
    return {
      bottom: rect.bottom,
      clientHeight: panel.clientHeight,
      isOpen: panel.matches(':popover-open') || panel.classList.contains('is-open'),
      maxBlockSize: style.maxBlockSize,
      overflowY: style.overflowY,
      scrollHeight: panel.scrollHeight,
      top: rect.top,
      triggerTop: triggerRect.top,
      viewportHeight: window.innerHeight,
    };
  });

  expect(geometry.isOpen).toBe(true);
  expect(geometry.top).toBeGreaterThanOrEqual(6);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight - 6);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.triggerTop - 6);
  expect(geometry.clientHeight).toBeLessThan(geometry.scrollHeight);
  expect(geometry.maxBlockSize).not.toBe('none');
  expect(geometry.overflowY).toMatch(/auto|scroll/);

  await page.evaluate(() => {
    window.__tallPopoverStop();
  });
});

test(':has()-driven segmented control reflects the checked radio', async ({ page }) => {
  await open(page);
  const seg = page.locator('.ui-segmented').first();
  const opts = seg.locator('.ui-segmented__option');
  const bg = (i) => opts.nth(i).evaluate((el) => getComputedStyle(el).backgroundColor);
  const before = await bg(2);
  // The radio is intentionally pointer-events:none (visually hidden);
  // the label is the control — clicking it checks the radio, and
  // `:has(input:checked)` must then paint the accent fill.
  await opts.nth(2).click();
  await expect.poll(() => bg(2)).not.toBe(before);
});

test('combobox filters and selects with keyboard in a real browser', async ({ page }) => {
  await open(page);
  const input = page.locator('#cbx');
  await input.fill('ba');
  await expect(page.getByRole('option', { name: 'Banana' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Apple' })).toBeHidden();
  await input.press('ArrowDown');
  await input.press('Enter');
  // The input shows the human LABEL; the data-value code rides the change event (C10).
  await expect(input).toHaveValue('Banana');
});

test('combobox re-init clears stale active descendant in a real browser', async ({ page }) => {
  await open(page);
  const input = page.locator('#cbx');
  await input.fill('a');
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
  await expect(page.locator('.ui-combobox__option.is-active')).toHaveCount(1);

  await page.evaluate(async () => {
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initCombobox } = await import(behaviorPath);
    window.__comboboxReinitStop = initCombobox();
  });

  await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/);
  await expect(page.locator('.ui-combobox__option.is-active')).toHaveCount(0);
  await expect(input).toHaveAttribute('aria-expanded', 'false');

  await input.fill('ba');
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(input).toHaveValue('Banana');
  await page.evaluate(() => window.__comboboxReinitStop());
});

test('combobox cleanup restores a filtered list in a real browser', async ({ page }) => {
  await open(page);
  const input = page.locator('#cbx');
  await page.evaluate(async () => {
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initCombobox } = await import(behaviorPath);
    window.__comboboxCleanupStop = initCombobox();
  });

  await input.fill('zzzznomatch');
  await expect(page.locator('.ui-combobox__option:not([hidden])')).toHaveCount(0);
  await expect(page.locator('.ui-combobox__empty')).toBeVisible();

  await page.evaluate(() => window.__comboboxCleanupStop());
  await expect(page.locator('.ui-combobox__option:not([hidden])')).toHaveCount(3);
  await expect(page.locator('.ui-combobox__empty')).toBeHidden();
  await expect(page.locator('.ui-combobox__option.is-active')).toHaveCount(0);
  await expect(input).not.toHaveAttribute('role', /.+/);
  await expect(input).not.toHaveAttribute('aria-expanded', /.+/);
  await expect(page.locator('.ui-combobox__list')).not.toHaveAttribute('role', /.+/);
});

test('form validation uses native browser constraints and Bronto summary UI', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const form = document.querySelector('form[data-bronto-validate]');
    window.__brontoSubmitDefaultPrevented = [];
    form.addEventListener('submit', (event) => {
      window.__brontoSubmitDefaultPrevented.push(event.defaultPrevented);
      event.preventDefault(); // keep the valid branch from navigating the demo.
    });
  });

  const form = page.locator('form[data-bronto-validate]');
  const input = form.getByLabel('Email (required)');
  const summary = form.locator('[data-bronto-error-summary]');
  await expect.poll(() => form.evaluate((el) => el.noValidate)).toBe(true);

  await form.getByRole('button', { name: 'Validate' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(form.locator('[data-bronto-error]')).not.toBeEmpty();
  await expect(summary).toBeVisible();
  await expect(summary).toHaveAttribute('role', 'alert');
  await expect(summary.locator('a[href="#em"]')).toHaveCount(1);
  await expect.poll(() => summary.evaluate((el) => document.activeElement === el)).toBe(true);
  expect(await page.evaluate(() => window.__brontoSubmitDefaultPrevented)).toEqual([true]);

  await input.fill('person@example.com');
  await input.blur();
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  await form.getByRole('button', { name: 'Validate' }).click();
  await expect(summary).toBeHidden();
  expect(await page.evaluate(() => window.__brontoSubmitDefaultPrevented)).toEqual([true, false]);
});

test('form validation cleanup restores generated validation UI in a real browser', async ({
  page,
}) => {
  await page.goto('/package.json');
  await page.setContent(`
    <form data-bronto-validate>
      <div class="ui-field">
        <label>Email <input class="ui-input" name="email" type="email" required /></label>
        <p class="ui-hint" data-bronto-error></p>
      </div>
      <div class="ui-error-summary" data-bronto-error-summary hidden></div>
      <button type="submit">Go</button>
    </form>`);
  await page.addScriptTag({
    type: 'module',
    content: `
    import { initFormValidation } from '/behaviors/index.js';
    window.__formValidationCleanupStop = initFormValidation();
    window.__formValidationCleanupReady = true;
    `,
  });
  await page.waitForFunction(() => window.__formValidationCleanupReady === true);

  const input = page.locator('input[name="email"]');
  const slot = page.locator('[data-bronto-error]');
  const summary = page.locator('[data-bronto-error-summary]');

  await page.getByRole('button', { name: 'Go' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAttribute('aria-describedby', /.+/);
  await expect(input).toHaveAttribute('id', /.+/);
  await expect(slot).toHaveAttribute('id', /.+/);
  await expect(slot).not.toBeEmpty();
  await expect(summary).toBeVisible();
  await expect(summary.locator('a')).toHaveCount(1);

  await page.evaluate(() => window.__formValidationCleanupStop());
  await expect(input).not.toHaveAttribute('aria-invalid', /.+/);
  await expect(input).not.toHaveAttribute('aria-describedby', /.+/);
  await expect(input).not.toHaveAttribute('id', /.+/);
  await expect(slot).not.toHaveAttribute('id', /.+/);
  await expect(slot).toBeEmpty();
  await expect(summary).toBeHidden();
  await expect(summary.locator('a')).toHaveCount(0);
  await expect(summary).not.toHaveAttribute('role', /.+/);
  await expect(summary).not.toHaveAttribute('tabindex', /.+/);
});

test('sortable selectable table updates order and selection state', async ({ page }) => {
  await open(page);
  const table = page.locator('[data-bronto-sortable]');
  await table.getByRole('button', { name: 'Name' }).click();
  await expect(table.locator('tbody tr').first()).toContainText('Ann');
  await table.getByLabel('Select all').check();
  await expect(table.locator('tbody tr[aria-selected="true"]')).toHaveCount(3);
});

test('table cleanup restores sort and selection state in a real browser', async ({ page }) => {
  await open(page);
  await page.evaluate(async () => {
    const wrap = document.createElement('section');
    wrap.innerHTML = `
      <table id="table-cleanup" class="ui-table ui-table--selectable" data-bronto-sortable>
        <thead><tr>
          <th><input type="checkbox" data-bronto-select-all aria-label="Select all rows" /></th>
          <th><button class="ui-table__sort" data-sort>Name</button></th>
        </tr></thead>
        <tbody>
          <tr><td><input type="checkbox" data-bronto-select /></td><td>Bob</td></tr>
          <tr><td><input type="checkbox" data-bronto-select /></td><td>Ann</td></tr>
          <tr><td><input type="checkbox" data-bronto-select /></td><td>Cy</td></tr>
        </tbody>
      </table>`;
    document.body.append(wrap);
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initTableSort } = await import(behaviorPath);
    window.__tableCleanupStop = initTableSort({ root: document.getElementById('table-cleanup') });
  });

  const table = page.locator('#table-cleanup');
  const sort = table.getByRole('button', { name: 'Name' });
  const nameHeader = table.locator('thead th').filter({ hasText: 'Name' });
  const selectAll = table.getByLabel('Select all rows');

  await expect(sort).toHaveAttribute('type', 'button');
  await sort.click();
  await expect(table.locator('tbody tr').first()).toContainText('Ann');
  await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  await selectAll.check();
  await expect(table.locator('tbody tr[aria-selected="true"]')).toHaveCount(3);
  await expect(table.locator('[data-bronto-select]:checked')).toHaveCount(3);

  await page.evaluate(() => window.__tableCleanupStop());
  await expect(table.locator('tbody tr').first()).toContainText('Bob');
  await expect(nameHeader).not.toHaveAttribute('aria-sort', /.+/);
  await expect(sort).not.toHaveAttribute('type', /.+/);
  await expect(selectAll).not.toBeChecked();
  await expect(table.locator('[data-bronto-select]:checked')).toHaveCount(0);
  await expect(table.locator('tbody tr[aria-selected]')).toHaveCount(0);

  await sort.click();
  await expect(table.locator('tbody tr').first()).toContainText('Bob');
  await selectAll.check();
  await expect(table.locator('[data-bronto-select]:checked')).toHaveCount(0);
});

test('carousel controls update the current slide and status', async ({ page }) => {
  await open(page);
  const carousel = page.locator('[data-bronto-carousel-label="Sample photos"]');
  const next = carousel.locator('[data-bronto-carousel-next]');
  const prev = carousel.locator('[data-bronto-carousel-prev]');
  const status = carousel.locator('.ui-carousel__status');

  await expect(status).toHaveText('1 / 3');
  await next.click();
  await expect(status).toHaveText('2 / 3');
  await expect(carousel.locator('.ui-carousel__thumb[aria-current="true"]')).toHaveAttribute(
    'aria-label',
    'Photo 2',
  );
  await prev.click();
  await expect(status).toHaveText('1 / 3');
  await expect(carousel.locator('.ui-carousel__thumb[aria-current="true"]')).toHaveAttribute(
    'aria-label',
    'Photo 1',
  );
});

test('carousel re-init preserves the live current slide in a real browser', async ({ page }) => {
  await open(page);
  const carousel = page.locator('[data-bronto-carousel-label="Sample photos"]');
  const next = carousel.locator('[data-bronto-carousel-next]');
  const status = carousel.locator('.ui-carousel__status');
  const currentThumb = carousel.locator('.ui-carousel__thumb[aria-current="true"]');

  await next.click();
  await expect(status).toHaveText('2 / 3');
  await expect(currentThumb).toHaveAttribute('aria-label', 'Photo 2');

  await page.evaluate(async () => {
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initCarousel } = await import(behaviorPath);
    window.__carouselReinitStop = initCarousel();
  });

  await expect(status).toHaveText('2 / 3');
  await expect(currentThumb).toHaveAttribute('aria-label', 'Photo 2');

  await next.click();
  await expect(status).toHaveText('3 / 3');
  await expect(currentThumb).toHaveAttribute('aria-label', 'Photo 3');
  await page.evaluate(() => window.__carouselReinitStop());
});

test('carousel cleanup restores generated ARIA and status in a real browser', async ({ page }) => {
  await open(page);
  await page.evaluate(async () => {
    const wrap = document.createElement('section');
    wrap.innerHTML = `
      <div id="carousel-cleanup" class="ui-carousel" data-bronto-carousel data-bronto-carousel-label="Cleanup photos">
        <div class="ui-carousel__viewport" role="region" aria-label="Authored carousel" tabindex="-1">
          <div class="ui-carousel__slide" role="listitem" aria-label="Authored slide">A</div>
          <div class="ui-carousel__slide">B</div>
        </div>
        <button data-bronto-carousel-prev>Previous</button>
        <button data-bronto-carousel-next>Next</button>
        <p class="ui-carousel__status" aria-live="off"><span>authored</span></p>
        <button class="ui-carousel__thumb">A</button>
        <button class="ui-carousel__thumb" aria-current="page">B</button>
      </div>`;
    document.body.append(wrap);
    const behaviorPath = `/behaviors/${'index.js'}`;
    const { initCarousel } = await import(behaviorPath);
    window.__carouselCleanupStop = initCarousel({
      root: document.getElementById('carousel-cleanup'),
    });
  });

  const carousel = page.locator('#carousel-cleanup');
  const viewport = carousel.locator('.ui-carousel__viewport');
  const slides = carousel.locator('.ui-carousel__slide');
  const prev = carousel.locator('[data-bronto-carousel-prev]');
  const next = carousel.locator('[data-bronto-carousel-next]');
  const status = carousel.locator('.ui-carousel__status');
  const thumbs = carousel.locator('.ui-carousel__thumb');

  await expect(viewport).toHaveAttribute('role', 'group');
  await expect(slides.nth(1)).toHaveAttribute('role', 'group');
  await expect(prev).toHaveAttribute('type', 'button');
  await expect(prev).toBeDisabled();
  await expect(next).toHaveAttribute('aria-label', 'Next');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(status).toHaveText('1 / 2');
  await expect(thumbs.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(thumbs.nth(1)).not.toHaveAttribute('aria-current', /.+/);

  await page.evaluate(() => window.__carouselCleanupStop());
  await expect(viewport).toHaveAttribute('role', 'region');
  await expect(viewport).toHaveAttribute('aria-label', 'Authored carousel');
  await expect(viewport).toHaveAttribute('tabindex', '-1');
  await expect(slides.nth(0)).toHaveAttribute('role', 'listitem');
  await expect(slides.nth(0)).toHaveAttribute('aria-label', 'Authored slide');
  await expect(slides.nth(1)).not.toHaveAttribute('role', /.+/);
  await expect(slides.nth(1)).not.toHaveAttribute('aria-label', /.+/);
  await expect(prev).not.toHaveAttribute('type', /.+/);
  await expect(prev).not.toBeDisabled();
  await expect(next).not.toHaveAttribute('aria-label', /.+/);
  await expect(status).toHaveAttribute('aria-live', 'off');
  await expect.poll(() => status.evaluate((el) => el.innerHTML)).toBe('<span>authored</span>');
  await expect(thumbs.nth(0)).not.toHaveAttribute('aria-current', /.+/);
  await expect(thumbs.nth(1)).toHaveAttribute('aria-current', 'page');

  await next.click();
  await expect(status).toHaveText('authored');
});

test('toast behavior creates a resident polite live region', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Push toast' }).click();
  const stack = page.locator('.ui-toast-stack:not(.ui-toast-stack--assertive)');
  await expect(stack).toHaveAttribute('aria-live', 'polite');
  await expect(stack.locator('.ui-toast')).toContainText('Order filled');
});

test('one-node glyph mask renders as a currentColor icon', async ({ page }) => {
  await open(page);
  const icon = page.locator('#glyphMask .ui-icon').first();
  await expect(icon).toBeVisible();
  const style = await icon.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      bg: cs.backgroundColor,
      mask: cs.maskImage,
      webkitMask: cs.webkitMaskImage,
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
    };
  });
  expect(style.width).toBeGreaterThan(0);
  expect(style.height).toBeGreaterThan(0);
  expect(style.bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(`${style.mask} ${style.webkitMask}`).toContain('data:image/svg+xml');
});

for (const theme of ['light', 'dark']) {
  test(`OKLCH accent ramp resolves to the generated ${theme} palette`, async ({ page }) => {
    await open(page, theme);
    const actual = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      const probe = document.createElement('span');
      document.body.append(probe);
      const colors = ['--accent-1', '--accent-2', '--accent-3', '--accent-4'].map((token) => {
        probe.style.color = `var(${token})`;
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = getComputedStyle(probe).color;
        ctx.fillRect(0, 0, 1, 1);
        return [token, [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]];
      });
      probe.remove();
      return Object.fromEntries(colors);
    });
    for (const [token, channels] of Object.entries(actual)) {
      expect(closeChannels(channels, hexChannels(resolved[theme][token]))).toBe(true);
    }
  });
}

function closeChannels(actual, expected) {
  return actual.every((channel, i) => Math.abs(channel - expected[i]) <= 1);
}

function hexChannels(value) {
  const hex = String(value).replace(/^#/, '');
  return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}
