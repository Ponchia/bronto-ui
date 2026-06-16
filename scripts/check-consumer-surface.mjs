/**
 * Tarball-level consumer import smoke.
 *
 * Source-tree imports can pass while the actual npm package is broken:
 * a file can be missing from `files`, a conditional export can point at the
 * wrong shipped target, or a public module can start touching DOM globals at
 * import time, or an asset/doc/font subpath can fail package resolution in a
 * clean consumer even though the file is present in the tarball. Optional
 * framework peers are another sharp edge: the core package must stay usable in
 * a clean consumer with no React/Solid/Qwik installed, while the adapter
 * subpaths still need a full peer-linked smoke. `check:pack`, publint, ATTW,
 * and example builds cover adjacent concerns; this gate imports public JS/JSON
 * subpaths, exact-compares their named export surfaces with the source modules,
 * and resolves every concrete non-code subpath from the packed tarball itself,
 * first without optional peers and then with adapter peers linked.
 *
 * Run: node scripts/check-consumer-surface.mjs
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exportTargets } from './lib/package-targets.mjs';
import { log } from './lib/stdio.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const tempRoot = mkdtempSync(resolve(tmpdir(), 'bronto-ui-consumer-surface-'));
const peerLinks = ['react', 'solid-js', '@builder.io/qwik'];
const peerBackedJsTargets = new Set(['./react/index.js', './solid/index.js', './qwik/index.js']);
let failed = false;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    env: process.env,
    stdio: options.stdio ?? 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.status}`);
  }
  return result.stdout ?? '';
}

function publicEntries(ext) {
  const bySubpath = new Map();
  for (const [label, target] of exportTargets(pkg)) {
    if (target.includes('*') || !target.endsWith(ext)) continue;
    const subpath = label.replace(/ \(.+\)$/, '');
    const specifier = subpath === '.' ? pkg.name : `${pkg.name}${subpath.slice(1)}`;
    bySubpath.set(subpath, { specifier, target });
  }
  return [...bySubpath.values()].sort((a, b) => a.specifier.localeCompare(b.specifier));
}

function publicAssetEntries(installedRoot) {
  const entries = new Map();
  for (const [label, target] of exportTargets(pkg)) {
    const subpath = label.replace(/ \(.+\)$/, '');
    if (target.includes('*')) {
      for (const entry of expandWildcardEntry(installedRoot, subpath, target)) {
        entries.set(entry.specifier, entry);
      }
      continue;
    }

    if (isImportableDataTarget(target) || target.endsWith('.d.ts')) continue;
    const specifier = subpath === '.' ? pkg.name : `${pkg.name}${subpath.slice(1)}`;
    entries.set(specifier, { specifier, target });
  }
  return [...entries.values()].sort((a, b) => a.specifier.localeCompare(b.specifier));
}

function behaviorNoDomNames(mod) {
  return Object.keys(mod)
    .filter(
      (name) =>
        name === 'applyStoredTheme' ||
        name === 'dismissible' ||
        name === 'toast' ||
        /^init[A-Z]/.test(name),
    )
    .sort();
}

async function expectedJsExportNames(entries) {
  const out = {};
  for (const { target } of entries) {
    const mod = await import(pathToFileURL(resolve(root, target)));
    out[target] = Object.keys(mod).sort();
  }
  return out;
}

function isImportableDataTarget(target) {
  return target.endsWith('.js') || target.endsWith('.json');
}

function expandWildcardEntry(installedRoot, subpath, targetPattern) {
  const targetParts = targetPattern.replace(/^\.\//, '').split('*');
  if (targetParts.length !== 2) return [];

  const [prefix, suffix] = targetParts;
  const dir = resolve(installedRoot, prefix);
  if (!existsSync(dir)) return [];

  const out = [];
  for (const file of walkFiles(dir)) {
    const target = relative(installedRoot, file).replace(/\\/g, '/');
    if (!target.startsWith(prefix) || !target.endsWith(suffix)) continue;
    const wildcard = target.slice(prefix.length, target.length - suffix.length);
    if (!wildcard) continue;
    const concreteSubpath = subpath.replace('*', wildcard);
    out.push({
      specifier: `${pkg.name}${concreteSubpath.slice(1)}`,
      target: `./${target}`,
    });
  }
  return out;
}

function walkFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(path));
    else if (entry.isFile()) out.push(path);
  }
  return out;
}

function linkPeerPackage(name) {
  const source = resolve(root, 'node_modules', name);
  if (!existsSync(source)) {
    throw new Error(`cannot smoke ${pkg.name}/${name}: missing dev peer ${source}`);
  }

  const target = resolve(tempRoot, 'node_modules', name);
  if (existsSync(target)) return;
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(source, target, process.platform === 'win32' ? 'junction' : 'dir');
}

function consumerScript(
  jsEntries,
  jsonEntries,
  assetEntries,
  expectedBehaviorNoDomNames,
  expectedJsExports,
) {
  return `
  import { existsSync } from 'node:fs';
  import { fileURLToPath } from 'node:url';

  const jsEntries = ${JSON.stringify(jsEntries)};
  const jsonEntries = ${JSON.stringify(jsonEntries)};
  const assetEntries = ${JSON.stringify(assetEntries)};
  const expectedBehaviorNoDomNames = ${JSON.stringify(expectedBehaviorNoDomNames)};
  const expectedJsExports = ${JSON.stringify(expectedJsExports)};
  const domGlobals = [
  'document',
  'window',
  'localStorage',
  'matchMedia',
  'CustomEvent',
  'HTMLElement',
  'Node',
];

for (const key of domGlobals) delete globalThis[key];

const failures = [];
let behaviorNoDom = 0;

function behaviorNoDomNames(mod) {
  return Object.keys(mod)
    .filter(
      (name) =>
        name === 'applyStoredTheme' ||
        name === 'dismissible' ||
        name === 'toast' ||
        /^init[A-Z]/.test(name),
    )
    .sort();
}

function invokeBehaviorNoDom(mod, name) {
  const result = name === 'toast' ? mod[name]('SSR smoke') : mod[name]();
  if (name === 'applyStoredTheme') {
    if (result !== undefined) {
      failures.push(name + ' returned ' + typeof result + ' without DOM; expected undefined');
    }
    return;
  }
  if (typeof result !== 'function') {
    failures.push(name + ' did not return a cleanup no-op without DOM');
    return;
  }
  result();
}

function smokeBehaviorsNoDom(mod) {
  const names = behaviorNoDomNames(mod);
  if (JSON.stringify(names) !== JSON.stringify(expectedBehaviorNoDomNames)) {
    failures.push(
      'packed @ponchia/ui/behaviors no-DOM export surface mismatch: expected [' +
        expectedBehaviorNoDomNames.join(', ') +
        '], got [' +
        names.join(', ') +
        ']',
    );
  }
  for (const name of names) {
    try {
      invokeBehaviorNoDom(mod, name);
      behaviorNoDom++;
    } catch (error) {
      failures.push(
        '@ponchia/ui/behaviors ' +
          name +
          ' no-DOM call failed: ' +
          (error?.stack || error),
      );
    }
  }
}

  for (const { specifier, target } of jsEntries) {
    try {
      const mod = await import(specifier);
      const names = Object.keys(mod).sort();
      const expectedNames = expectedJsExports[target];
      if (!expectedNames) {
        failures.push(\`\${specifier} (\${target}) has no source export expectation\`);
      } else if (JSON.stringify(names) !== JSON.stringify(expectedNames)) {
        failures.push(
          \`\${specifier} (\${target}) export surface mismatch: expected [\${expectedNames.join(', ')}], got [\${names.join(', ')}]\`,
        );
      }
      if (names.length === 0) failures.push(\`\${specifier} (\${target}) exported nothing\`);
      if (target === './behaviors/index.js') smokeBehaviorsNoDom(mod);
    } catch (error) {
      failures.push(\`\${specifier} (\${target}) import failed: \${error?.stack || error}\`);
  }
}

for (const { specifier, target } of jsonEntries) {
  try {
    const mod = await import(specifier, { with: { type: 'json' } });
    if (!mod.default || typeof mod.default !== 'object') {
      failures.push(\`\${specifier} (\${target}) did not import as JSON data\`);
    }
  } catch (error) {
    failures.push(\`\${specifier} (\${target}) JSON import failed: \${error?.stack || error}\`);
  }
}

for (const { specifier, target } of assetEntries) {
  try {
    const resolved = import.meta.resolve(specifier);
    if (!resolved.startsWith('file:')) {
      failures.push(\`\${specifier} (\${target}) resolved to non-file URL: \${resolved}\`);
      continue;
    }
    if (!existsSync(fileURLToPath(resolved))) {
      failures.push(\`\${specifier} (\${target}) resolved to missing file: \${resolved}\`);
    }
  } catch (error) {
    failures.push(\`\${specifier} (\${target}) resolution failed: \${error?.stack || error}\`);
  }
}

for (const key of domGlobals) {
  if (globalThis[key] !== undefined) failures.push(\`\${key} was created during public imports\`);
}
if (behaviorNoDom === 0) {
  failures.push('packed @ponchia/ui/behaviors no-DOM lifecycle smoke did not run');
}

if (failures.length) {
  console.error(failures.join('\\n\\n'));
  process.exit(1);
}

console.log(JSON.stringify({ js: jsEntries.length, json: jsonEntries.length, assets: assetEntries.length, behaviorNoDom }));
`;
}

try {
  const expectedBehaviorNoDomNames = behaviorNoDomNames(
    await import(pathToFileURL(resolve(root, 'behaviors/index.js'))),
  );
  if (expectedBehaviorNoDomNames.length === 0) {
    throw new Error('could not derive expected no-DOM behavior names from behaviors/index.js');
  }

  const jsEntries = publicEntries('.js');
  const expectedJsExports = await expectedJsExportNames(jsEntries);
  const noPeerJsEntries = jsEntries.filter((entry) => !peerBackedJsTargets.has(entry.target));
  const peerBackedJsEntries = jsEntries.filter((entry) => peerBackedJsTargets.has(entry.target));
  const jsonEntries = publicEntries('.json');
  if (jsEntries.length === 0) throw new Error('no public JS entries found');
  if (peerBackedJsEntries.length !== peerBackedJsTargets.size) {
    throw new Error(
      `expected ${peerBackedJsTargets.size} optional-peer-backed JS entries, found ${peerBackedJsEntries.length}`,
    );
  }
  if (jsonEntries.length === 0) throw new Error('no public JSON entries found');

  writeFileSync(
    resolve(tempRoot, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  );

  log(`Packing ${pkg.name} into ${tempRoot}`);
  run(npm, ['pack', '--silent', '--pack-destination', tempRoot, '--ignore-scripts'], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const tarballs = readdirSync(tempRoot).filter((name) => name.endsWith('.tgz'));
  if (tarballs.length !== 1) {
    throw new Error(`Expected one packed tarball in ${tempRoot}, found ${tarballs.length}`);
  }

  run(
    npm,
    [
      'install',
      '--silent',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      resolve(tempRoot, tarballs[0]),
    ],
    { cwd: tempRoot, stdio: ['ignore', 'pipe', 'inherit'] },
  );

  const installedRoot = resolve(tempRoot, 'node_modules', ...pkg.name.split('/'));
  const assetEntries = publicAssetEntries(installedRoot);
  if (assetEntries.length === 0) throw new Error('no public asset/doc entries found');

  const noPeerOut = run(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      consumerScript(
        noPeerJsEntries,
        jsonEntries,
        assetEntries,
        expectedBehaviorNoDomNames,
        expectedJsExports,
      ),
    ],
    { cwd: tempRoot, stdio: ['ignore', 'pipe', 'inherit'] },
  ).trim();
  const noPeerCounts = JSON.parse(noPeerOut);

  for (const peer of peerLinks) linkPeerPackage(peer);

  const out = run(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      consumerScript(
        jsEntries,
        jsonEntries,
        assetEntries,
        expectedBehaviorNoDomNames,
        expectedJsExports,
      ),
    ],
    { cwd: tempRoot, stdio: ['ignore', 'pipe', 'inherit'] },
  ).trim();
  const counts = JSON.parse(out);
  log(
    `✓ packed no-peer consumer surface imports and export-matches ${noPeerCounts.js} core JS subpath${
      noPeerCounts.js === 1 ? '' : 's'
    }, ${noPeerCounts.json} JSON subpath${noPeerCounts.json === 1 ? '' : 's'}, and resolves ${
      noPeerCounts.assets
    } asset/doc subpath${noPeerCounts.assets === 1 ? '' : 's'} without optional peers; ` +
      `peer-linked full surface imports and export-matches ${counts.js} JS subpath${
        counts.js === 1 ? '' : 's'
      }; ${
        counts.behaviorNoDom
      } behavior no-DOM call${counts.behaviorNoDom === 1 ? '' : 's'} stay SSR-safe`,
  );
} catch (error) {
  failed = true;
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (failed) log(`Kept temp consumer workspace: ${tempRoot}`);
  else rmSync(tempRoot, { recursive: true, force: true });
}
