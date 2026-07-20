#!/usr/bin/env node
/** Validate literal Bronto classes and CSS custom-property references in a consumer. */
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { extname, resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const classesManifest = JSON.parse(
  readFileSync(resolve(packageRoot, 'classes/classes.json'), 'utf8'),
);
const tokensManifest = JSON.parse(readFileSync(resolve(packageRoot, 'tokens/index.json'), 'utf8'));

const SOURCE_EXTENSIONS = new Set([
  '.astro',
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.mjs',
  '.svelte',
  '.ts',
  '.tsx',
  '.vue',
]);
const SKIP_DIRS = new Set([
  '.git',
  '.astro',
  '.next',
  '.nuxt',
  '.output',
  '.svelte-kit',
  '.vercel',
  '.vite',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'playwright-report',
  'public',
  'storybook-static',
  'test-results',
]);

const knownClasses = new Set(classesManifest.classes);
// CSS generic font-family keywords share the ui-* prefix but are never class
// literals. Keep the scanner broad enough to catch JS-built class strings
// while excluding these standardized non-class identifiers.
const nonClassIdentifiers = new Set(['ui-monospace', 'ui-rounded', 'ui-sans-serif', 'ui-serif']);
const knownTokens = new Set(
  Object.values(tokensManifest.cssVars).flatMap((group) => Object.keys(group)),
);
for (const property of classesManifest.customProperties) knownTokens.add(property.name);
for (const entry of readdirSync(resolve(packageRoot, 'dist/css'), { withFileTypes: true })) {
  if (!entry.isFile() || extname(entry.name) !== '.css') continue;
  const css = readFileSync(resolve(packageRoot, 'dist/css', entry.name), 'utf8');
  for (const match of css.matchAll(/(--[a-z][\w-]*)\s*:/gi)) knownTokens.add(match[1]);
}
const reservedTokenPrefixes = new Set(
  [...knownTokens].map((name) => `--${name.slice(2).split('-')[0]}`),
);
const LINE_COMMENT_EXTENSIONS = new Set([
  '.astro',
  '.html',
  '.js',
  '.jsx',
  '.mjs',
  '.svelte',
  '.ts',
  '.tsx',
  '.vue',
]);
const HTML_COMMENT_EXTENSIONS = new Set(['.astro', '.html', '.svelte', '.vue']);

const blankComment = (value) => value.replace(/[^\r\n]/g, ' ');

function quoteEnd(text, start, quote) {
  for (let index = start + 1; index < text.length; index += 1) {
    if (text[index] === '\\') index += 1;
    else if (text[index] === quote) return index + 1;
  }
  return text.length;
}

function stripSlashComments(text, lineComments) {
  let output = '';
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' || char === "'" || char === '`') {
      const end = quoteEnd(text, index, char);
      output += text.slice(index, end);
      index = end;
      continue;
    }
    if (char === '/' && next === '*') {
      const close = text.indexOf('*/', index + 2);
      const end = close === -1 ? text.length : close + 2;
      output += blankComment(text.slice(index, end));
      index = end;
      continue;
    }
    if (lineComments && char === '/' && next === '/') {
      const newline = text.indexOf('\n', index + 2);
      const end = newline === -1 ? text.length : newline;
      output += blankComment(text.slice(index, end));
      index = end;
      continue;
    }
    output += char;
    index += 1;
  }
  return output;
}

function sourceText(text, extension) {
  const withoutHtml = HTML_COMMENT_EXTENSIONS.has(extension)
    ? text.replace(/<!--[\s\S]*?-->/g, blankComment)
    : text;
  return stripSlashComments(withoutHtml, LINE_COMMENT_EXTENSIONS.has(extension));
}

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function filesUnder(input) {
  const absolute = resolve(input);
  const stat = statSync(absolute);
  if (stat.isFile()) return SOURCE_EXTENSIONS.has(extname(absolute)) ? [absolute] : [];
  if (!stat.isDirectory()) return [];
  const files = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const child = resolve(absolute, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) files.push(...filesUnder(child));
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(child);
    }
  }
  return files;
}

function tokenPrefix(name) {
  return `--${name.slice(2).split('-')[0]}`;
}

export function checkPaths(inputs, { allowClasses = [], allowTokens = [] } = {}) {
  const allowedClasses = new Set([...knownClasses, ...allowClasses]);
  const allowedTokens = new Set([...knownTokens, ...allowTokens]);
  const files = [...new Set(inputs.flatMap(filesUnder))].sort();
  const documents = files.map((file) => {
    const text = readFileSync(file, 'utf8');
    return { file, text, scanned: sourceText(text, extname(file)) };
  });
  const locallyDefinedTokens = new Set();
  for (const { scanned } of documents) {
    for (const match of scanned.matchAll(/(--[a-z][\w-]*)\s*:/gi)) {
      locallyDefinedTokens.add(match[1]);
    }
  }

  const findings = [];
  const seen = new Set();
  const add = (finding) => {
    const key = `${finding.kind}:${finding.file}:${finding.line}:${finding.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push(finding);
  };

  for (const { file, text, scanned } of documents) {
    for (const match of scanned.matchAll(/(?<![/\w-])ui-[a-z0-9](?:[\w-]*[a-z0-9])?(?![\w/-])/gi)) {
      if (!allowedClasses.has(match[0]) && !nonClassIdentifiers.has(match[0])) {
        add({ kind: 'class', file, line: lineAt(text, match.index), name: match[0] });
      }
    }
    for (const match of scanned.matchAll(/var\(\s*(--[a-z][\w-]*)/gi)) {
      const name = match[1];
      if (
        reservedTokenPrefixes.has(tokenPrefix(name)) &&
        !allowedTokens.has(name) &&
        !locallyDefinedTokens.has(name)
      ) {
        add({ kind: 'token', file, line: lineAt(text, match.index), name });
      }
    }
  }

  return { files: files.length, findings };
}

function usage() {
  return (
    `Usage: bronto-ui-check [options] [path ...]\n\n` +
    `Validate literal ui-* classes and unresolved Bronto-like var(--*) references.\n\n` +
    `Options:\n` +
    `  --allow-class NAME   Allow one consumer-owned ui-* class (repeatable)\n` +
    `  --allow-token NAME   Allow one consumer-owned --* token (repeatable)\n` +
    `  --json               Print machine-readable JSON\n` +
    `  --help               Show this help\n`
  );
}

function parseArgs(args) {
  const options = { allowClasses: [], allowTokens: [], json: false, paths: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help') return { ...options, help: true };
    if (arg === '--json') options.json = true;
    else if (arg === '--allow-class') {
      const value = args[++index];
      if (!/^ui-[a-z0-9][\w-]*$/i.test(value || '')) {
        throw new Error('--allow-class requires one ui-* class name');
      }
      options.allowClasses.push(value);
    } else if (arg === '--allow-token') {
      const value = args[++index];
      if (!/^--[a-z][\w-]*$/i.test(value || '')) {
        throw new Error('--allow-token requires one --* custom-property name');
      }
      options.allowTokens.push(value);
    } else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    else options.paths.push(arg);
  }
  return options;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(usage());
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    console.log(usage());
    return;
  }
  const paths = options.paths.length ? options.paths : ['.'];
  let result;
  try {
    result = checkPaths(paths, options);
  } catch (error) {
    console.error(`[bronto-ui-check] ${error.message}`);
    process.exitCode = 2;
    return;
  }
  const cwd = process.cwd();
  const output = {
    files: result.files,
    findings: result.findings.map((finding) => ({
      ...finding,
      file: relative(cwd, finding.file) || '.',
    })),
  };
  if (options.json) console.log(JSON.stringify(output, null, 2));
  else if (output.findings.length) {
    for (const finding of output.findings) {
      console.error(
        `${finding.file}:${finding.line} unknown Bronto ${finding.kind} ${finding.name}`,
      );
    }
    console.error(
      `[bronto-ui-check] ${output.findings.length} finding(s) in ${output.files} source file(s)`,
    );
  } else {
    console.log(`[bronto-ui-check] ${output.files} source file(s) match the shipped contract`);
  }
  if (output.findings.length) process.exitCode = 1;
}

// npm installs bins as symlinks in node_modules/.bin. Compare their real path
// so the CLI runs both through that public entrypoint and by its package path.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main();
