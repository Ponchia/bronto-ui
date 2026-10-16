/** Runtime proof that a packed UI consumer uses the independent annotation engine. */
export async function assertIndependentAnnotations(page) {
  await page.getByRole('heading', { name: 'UI + Annotations' }).waitFor();
  await page.locator('#stage[data-ready="true"]').waitFor();
  const note = page.locator('#annotation-overlay .pa-annotation');
  const connector = page.locator('#annotation-overlay .pa-annotation__connector');
  if ((await note.count()) !== 1) throw new Error('independent engine must render one annotation');
  if ((await page.locator('.ui-annotation').count()) !== 0)
    throw new Error('new consumer must not emit legacy UI annotations');
  const before = await connector.getAttribute('d');
  if (!before || /NaN|Infinity/.test(before)) throw new Error('connector path must be finite');
  const move = page.getByRole('button', { name: 'Move target' });
  await move.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    (previous) =>
      document.querySelector('#annotation-overlay .pa-annotation__connector')?.getAttribute('d') !==
      previous,
    before,
  );
  await page.getByRole('button', { name: 'Hide annotation' }).click();
  if ((await note.count()) !== 0)
    throw new Error('host-controlled removal did not remove the note');
  await page.getByRole('button', { name: 'Show annotation' }).click();
  if ((await note.count()) !== 1)
    throw new Error('host-controlled restore did not render the note');
  await assertCoordinateSpace(page);
  const fallback = await page.locator('#annotation-description').textContent();
  if (!fallback.includes('Selected target:')) throw new Error('the text alternative is missing');
}

async function assertCoordinateSpace(page) {
  const observed = await page.locator('#stage').evaluate((stage) => {
    const svg = stage.querySelector('.pa-annotation-layer');
    const target = stage.querySelector('.host-target');
    const title = stage.querySelector('.pa-annotation__title');
    const vb = svg.viewBox.baseVal;
    return {
      width: stage.clientWidth,
      viewBox: vb.width,
      target: Number(target.getAttribute('cx')),
      ink: getComputedStyle(title).fill,
    };
  });
  if (Math.abs(observed.width - observed.viewBox) > 1)
    throw new Error('annotation and host coordinate widths differ');
  if (!(observed.target > 0 && observed.target < observed.viewBox))
    throw new Error('target left its host');
  if (!observed.ink || observed.ink === 'none')
    throw new Error('annotation text has no visible theme ink');
}
