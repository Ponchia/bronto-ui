import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPaths } from '../bin/bronto-ui-check.mjs';
import { migrationAudit } from '../bin/migration-audit.mjs';

const checker = fileURLToPath(new URL('../bin/bronto-ui-check.mjs', import.meta.url));
const registry = JSON.parse(readFileSync(new URL('../MIGRATIONS.json', import.meta.url), 'utf8'));
const rules = registry.migrations.find((edge) => edge.to === '0.17').audit.rules;

function fixture(body) {
  const root = mkdtempSync(resolve(tmpdir(), 'bronto-ui-migration-'));
  try {
    return body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('every registered migration marker is reached by its literal rule', () => {
  const audit = migrationAudit('0.17');
  for (const rule of rules) {
    for (const value of rule.values) {
      const literal = rule.type.startsWith('member') ? `${rule.owner}.${value}` : value;
      assert.ok(
        audit.scan(literal).some((match) => match.rule === rule.id),
        `${rule.id}: ${literal}`,
      );
    }
  }
  assert.match(audit.metadata.scope, /aliases.*computed/);
  assert.equal(audit.metadata.guide, 'docs/migrations/0.16-to-0.17.md');
});

test('migration mode is opt-in and preserves legacy 0.17 compatibility by default', () =>
  fixture((root) => {
    const file = resolve(root, 'view.tsx');
    const text =
      "import '@ponchia/ui/annotations';\nui.annotation();\nconst key = cls.annotationNote;\nconst markup = '<g class=\"ui-annotation__note\" />';";
    writeFileSync(file, text);
    const normal = checkPaths([file]);
    assert.deepEqual(normal.findings, []);
    assert.equal(normal.migration, undefined);
    const migration = checkPaths([file], { migration: '0.17' });
    assert.deepEqual(
      migration.findings.map(({ rule, line }) => [rule, line]),
      [
        ['annotation-import', 1],
        ['annotation-recipe', 2],
        ['annotation-class-key', 3],
        ['annotation-markup', 4],
      ],
    );
    assert.equal(readFileSync(file, 'utf8'), text, 'the audit never rewrites consumer source');
  }));

test('direct and indirect CSS imports are both reported, including unlayered exports', () =>
  fixture((root) => {
    const file = resolve(root, 'style.css');
    writeFileSync(
      file,
      [
        "@import '@ponchia/ui/css/annotations.css';",
        "@import '@ponchia/ui/css/unlayered/annotations.css';",
        "@import '@ponchia/ui/css/analytical.css';",
        "@import '@ponchia/ui/css/report-kit.css';",
      ].join('\n'),
    );
    assert.deepEqual(
      checkPaths([file], { migration: '0.17' }).findings.map(({ rule }) => rule),
      ['annotation-styles', 'annotation-styles', 'annotation-rollup', 'annotation-rollup'],
    );
  }));

test('named ESM and CJS aliases, bracket names and simple const keys are reviewable', () =>
  fixture((root) => {
    const file = resolve(root, 'aliased.tsx');
    writeFileSync(
      file,
      [
        "import { ui as kit, cls as classes } from '@ponchia/ui/classes';",
        'kit.annotation();',
        "classes['annotationNote'];",
        "const legacyMethod = 'annotation'; kit[legacyMethod]();",
        "const { ui: uiCjs, cls: clsCjs } = require('@ponchia/ui/classes');",
        'uiCjs[`annotation`]();',
        'clsCjs.annotationEntry;',
      ].join('\n'),
    );
    const result = checkPaths([file], { migration: '0.17' });
    assert.deepEqual(
      result.findings.map(({ rule, line }) => [rule, line]),
      [
        ['annotation-recipe', 2],
        ['annotation-class-key', 3],
        ['annotation-recipe', 4],
        ['annotation-recipe', 6],
        ['annotation-class-key', 7],
      ],
    );
  }));

test('static two-part import specifiers flag otherwise invisible legacy modules', () =>
  fixture((root) => {
    const file = resolve(root, 'dynamic.ts');
    writeFileSync(
      file,
      [
        "const lazy = import('@ponchia/ui/' + 'annotations');",
        "const stylesheet = '@ponchia/ui/css/' + 'report-kit.css';",
        "const direct = require('@ponchia/ui/css/' + 'annotations.css');",
      ].join('\n'),
    );
    assert.deepEqual(
      checkPaths([file], { migration: '0.17' }).findings.map(({ rule, line }) => [rule, line]),
      [
        ['annotation-import', 1],
        ['annotation-rollup', 2],
        ['annotation-styles', 3],
      ],
    );
  }));

test('unrelated alias owners and computed names remain outside the migration report', () => {
  const audit = migrationAudit('0.17');
  assert.deepEqual(
    audit.scan(
      [
        "import { ui as external } from '@other/ui';",
        "const { cls: externalCls } = require('@other/ui/classes');",
        "const key = 'annotation'; external[key](); externalCls.annotationNote;",
        "const allowed = '@ponchia/annotations/bronto.css';",
        "const uiClass = '@ponchia/ui/css/' + 'figure.css';",
      ].join('\n'),
    ),
    [],
  );
});

test('standalone annotation ownership and unrelated connectors remain clean', () =>
  fixture((root) => {
    const file = resolve(root, 'app.js');
    writeFileSync(
      file,
      "import '@ponchia/annotations';\nimport '@ponchia/annotations/bronto.css';\nimport '@ponchia/ui/connectors';\nimport '@ponchia/ui/css/figure.css';\nconst className = 'pa-annotation__note';",
    );
    assert.deepEqual(checkPaths([file], { migration: '0.17' }).findings, []);
  }));

test('source comments and generated/vendor directories do not inflate the audit', () =>
  fixture((root) => {
    writeFileSync(
      resolve(root, 'style.css'),
      "/* @import '@ponchia/ui/css/analytical.css'; */\n.ui-annotation--accent { color: red; }",
    );
    writeFileSync(
      resolve(root, 'view.ts'),
      '// ui.annotation()\n/* cls.annotation */\nui . annotation();',
    );
    for (const directory of ['node_modules', 'dist', 'test-results']) {
      mkdirSync(resolve(root, directory));
      writeFileSync(resolve(root, directory, 'ignored.js'), "import '@ponchia/ui/annotations';");
    }
    const result = checkPaths([root], { migration: '0.17' });
    assert.equal(result.files, 2);
    assert.deepEqual(
      result.findings.map(({ rule, line }) => [rule, line]),
      [
        ['annotation-markup', 2],
        ['annotation-recipe', 3],
      ],
    );
  }));

test('literal boundaries do not match similar packages, classes or member names', () => {
  const audit = migrationAudit('0.17');
  for (const source of [
    '@ponchia/ui/annotations-extra',
    '@ponchia/ui/annotations/internal',
    '@ponchia/ui/css/analyticalXcss',
    '@ponchia/ui/css/analytical.css.map',
    '@ponchia/ui/css/analytical.cssx',
    'some-ui-annotation',
    'ui-annotations',
    'myui.annotation()',
    'ui.annotations()',
    'mycls.annotationNote',
  ])
    assert.deepEqual(audit.scan(source), [], source);
  assert.equal(audit.scan('ui\n. annotation()').length, 1);
});

test('legacy markup is a review marker even with standalone compatibility styling', () =>
  fixture((root) => {
    const file = resolve(root, 'app.js');
    writeFileSync(
      file,
      "import '@ponchia/annotations/bronto.css';\nconst markup = 'ui-annotation ui-annotation__note';",
    );
    const findings = checkPaths([file], { migration: '0.17' }).findings;
    assert.equal(findings.length, 2);
    for (const finding of findings) assert.match(finding.message, /does not prove UI-owned styles/);
  }));

test('CLI JSON, textual review messages and invalid migration arguments preserve exit semantics', () =>
  fixture((root) => {
    const file = resolve(root, 'view.js');
    writeFileSync(file, "import '@ponchia/ui/css/report-kit.css';");
    const run = (...args) =>
      spawnSync(process.execPath, [checker, ...args], { cwd: root, encoding: 'utf8' });
    assert.equal(run(file).status, 0);
    const result = run('--migration', '0.17', '--json', file);
    assert.equal(result.status, 1);
    const output = JSON.parse(result.stdout);
    assert.equal(output.migration.to, '0.17');
    assert.equal(output.findings[0].kind, 'migration');
    assert.equal(output.findings[0].file, 'view.js');
    const text = run('--migration', '0.17', file);
    assert.match(text.stderr, /migration review \[annotation-rollup\]/);
    assert.doesNotMatch(text.stderr, /unknown Bronto migration/);
    for (const args of [
      ['--migration'],
      ['--migration', '--json'],
      ['--migration', '0.18'],
      ['--migration', '0.17', '--migration', '0.17'],
    ]) {
      assert.equal(run(...args).status, 2, args.join(' '));
    }
    writeFileSync(file, "import '@ponchia/annotations';");
    const clean = run('--migration', '0.17', '--json', file);
    assert.equal(clean.status, 0);
    assert.match(JSON.parse(clean.stdout).migration.scope, /rendered geometry/);
  }));

test('migration audit covers CJS and TypeScript module extensions', () =>
  fixture((root) => {
    for (const extension of ['cjs', 'cts', 'mts']) {
      writeFileSync(
        resolve(root, `module.${extension}`),
        "// '@ponchia/ui/css/analytical.css'\nconst lib = require('@ponchia/ui/annotations');",
      );
    }
    const result = checkPaths([root], { migration: '0.17' });
    assert.equal(result.files, 3);
    assert.deepEqual(
      result.findings.map(({ rule, line }) => [rule, line]),
      Array(3).fill(['annotation-import', 2]),
    );
  }));

test('an empty source audit is not reported as a clean migration', () =>
  fixture((root) => {
    writeFileSync(resolve(root, 'README.md'), 'No runtime source here.');
    assert.throws(() => checkPaths([root], { migration: '0.17' }), /no supported source files/);
    const result = spawnSync(process.execPath, [checker, '--migration', '0.17', root], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /no supported source files/);
    assert.equal(checkPaths([root]).files, 0, 'ordinary scan keeps its existing behavior');
  }));

test('consumer checker can be imported by a stdin-driven ESM caller', () => {
  const entry = new URL('../bin/bronto-ui-check.mjs', import.meta.url).href;
  const result = spawnSync(process.execPath, ['--input-type=module', '-'], {
    encoding: 'utf8',
    input: `const module = await import(${JSON.stringify(entry)}); console.log(typeof module.checkPaths);`,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), 'function');
});
