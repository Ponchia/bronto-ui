import { test, expect } from '@playwright/test';

async function open(page) {
  await page.goto('/demo/sources.html', { waitUntil: 'networkidle' });
}

test('initSources seeds citation metadata and focuses the target source', async ({ page }) => {
  await open(page);
  const citation = page.locator('.ui-citation[aria-label="Source 1"]');
  const source = page.locator('#s1');

  await expect(citation).toHaveAttribute('aria-describedby', /(^|\s)s1(\s|$)/);
  await expect(citation).toHaveAttribute('title', /Q3 incident review/);

  await page.evaluate(() => {
    window.__sourceFocusDetails = [];
    document
      .querySelector('[data-bronto-sources]')
      .addEventListener('bronto:source:focus', (event) => {
        window.__sourceFocusDetails.push(event.detail.id);
      });
  });

  await citation.click();
  await expect(source).toBeFocused();
  await expect(source).toHaveClass(/is-source-active/);
  await expect.poll(() => page.evaluate(() => window.__sourceFocusDetails)).toEqual(['s1']);
});

test('initSources cleanup clears detached generated highlight and restores authored active source', async ({
  page,
}) => {
  await open(page);

  await page.evaluate(() => {
    const island = document.createElement('main');
    island.id = 'sources-cleanup';
    island.setAttribute('data-bronto-sources', '');
    island.innerHTML = `
      <button type="button" data-bronto-source-ref="cleanup-s2">Preview source 2</button>
      <article id="cleanup-s1" class="ui-source-card is-source-active">
        <h3 class="ui-source-card__title">Authored active</h3>
      </article>
      <article id="cleanup-s2" class="ui-source-card">
        <h3 class="ui-source-card__title">Generated active</h3>
      </article>
    `;
    document.body.append(island);
  });
  await page.addScriptTag({
    type: 'module',
    content: `
    import { initSources } from '/behaviors/index.js';
    window.__sourcesCleanupStop = initSources({ root: document.getElementById('sources-cleanup') });
    window.__sourcesCleanupReady = true;
    `,
  });
  await page.waitForFunction(() => window.__sourcesCleanupReady === true);

  const island = page.locator('#sources-cleanup');
  const button = island.locator('[data-bronto-source-ref]');
  const authored = page.locator('#cleanup-s1');
  const generated = page.locator('#cleanup-s2');

  await button.click();
  await expect(authored).not.toHaveClass(/is-source-active/);
  await expect(generated).toHaveClass(/is-source-active/);
  await expect(generated).toHaveAttribute('tabindex', '-1');

  await page.evaluate(() => {
    window.__detachedGeneratedSource = document.getElementById('cleanup-s2');
    window.__detachedGeneratedSource.remove();
    window.__sourcesCleanupStop();
  });

  await expect(authored).toHaveClass(/is-source-active/);
  await expect(button).not.toHaveAttribute('aria-describedby', /cleanup-s2/);
  await expect(button).not.toHaveAttribute('title', /Generated active/);

  await expect
    .poll(() =>
      page.evaluate(() => ({
        active: window.__detachedGeneratedSource.classList.contains('is-source-active'),
        tabindex: window.__detachedGeneratedSource.getAttribute('tabindex'),
      })),
    )
    .toEqual({ active: false, tabindex: null });

  await button.click();
  await expect(authored).toHaveClass(/is-source-active/);
});
