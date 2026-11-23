import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { checkPaths } from '../bin/bronto-ui-check.mjs';

test('consumer checker reserves the lowercase UI class prefix', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'bronto-ui-check-prefix-'));
  try {
    const file = resolve(root, 'inbox.test.ts');
    writeFileSync(
      file,
      'assert.equal(cards.length, 51, "No 50-card UI-page limit");\n' +
        'const className = "ui-alert ui-Alert ui-notice";\n',
    );

    assert.deepEqual(
      checkPaths([file]).findings.map(({ kind, line, name }) => [kind, line, name]),
      [
        ['class', 2, 'ui-Alert'],
        ['class', 2, 'ui-notice'],
      ],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
