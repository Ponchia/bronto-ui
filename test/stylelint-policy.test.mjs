import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import stylelint from 'stylelint';

const config = JSON.parse(readFileSync(new URL('../.stylelintrc.json', import.meta.url), 'utf8'));
const lint = (declarations) => stylelint.lint({ code: `.fixture { ${declarations} }`, config });

// These regressions protect the former plugin's enforcement during migration
// to Stylelint's maintained native rules. No browser CSS is rewritten here.
test('logical CSS policy still rejects physical longhands, dimensions and corners', async () => {
  for (const declaration of [
    'top: 0;',
    'right: 0;',
    'bottom: 0;',
    'left: 0;',
    'margin-left: 1px;',
    'padding-right: 1px;',
    'width: 1px;',
    'height: 1px;',
    'min-width: 1px;',
    'max-height: 1px;',
    'border-top-left-radius: 1px;',
    'border-left: 1px solid;',
  ]) {
    const result = await lint(declaration);
    assert.ok(result.errored, declaration);
    assert.ok(
      result.results[0].warnings.some((warning) => warning.rule === 'property-layout-mappings'),
      declaration,
    );
  }
});

test('logical CSS policy rejects physical alignment and float values', async () => {
  for (const declaration of ['text-align: left;', 'text-align: right;', 'float: left;']) {
    const result = await lint(declaration);
    assert.ok(result.errored, declaration);
    assert.ok(
      result.results[0].warnings.some(
        (warning) => warning.rule === 'value-keyword-layout-mappings',
      ),
      declaration,
    );
  }
});

test('logical equivalents and existing shorthand/axis policy remain valid', async () => {
  for (const declaration of [
    'inset-block-start: 0;',
    'margin-inline-start: 1px;',
    'padding-inline-end: 1px;',
    'inline-size: 1px;',
    'block-size: 1px;',
    'border-start-start-radius: 1px;',
    'text-align: start;',
    'float: inline-start;',
    'margin: 0 1px;',
    'padding: 1px 2px;',
    'border-width: 0 1px;',
    'overflow-x: auto;',
    'overflow-y: auto;',
    'resize: vertical;',
  ]) {
    const result = await lint(declaration);
    assert.equal(
      result.errored,
      false,
      `${declaration}: ${JSON.stringify(result.results[0].warnings)}`,
    );
  }
});

test('the documented physical integration exception remains declaration-local', async () => {
  const result = await stylelint.lint({
    code: `.fixture {
      /* stylelint-disable-next-line property-layout-mappings -- Override an upstream physical border. */
      border-left: 0;
      margin-left: 1px;
    }`,
    config,
  });
  const warnings = result.results[0].warnings.filter(
    (warning) => warning.rule === 'property-layout-mappings',
  );
  assert.equal(warnings.length, 1);
  assert.match(warnings[0].text, /margin-left/);
});
