/** Publish the starter's three workspace files without a second authored demo. */
import { readFile, writeFile } from 'node:fs/promises';
import { join, posix } from 'node:path';

function publicAsset(pkg, specifier, extension, output) {
  const key = specifier === pkg.name ? '.' : `.${specifier.slice(pkg.name.length)}`;
  const entry = pkg.exports[key];
  const target = typeof entry === 'string' ? entry : entry?.default;
  if (
    typeof target !== 'string' ||
    !target.startsWith('./') ||
    target.includes('\\') ||
    target.includes('*') ||
    target.split('/').includes('..') ||
    posix.extname(target) !== extension
  ) {
    throw new Error(`Workspace needs a concrete ${extension} public export: ${specifier}`);
  }
  const relative = posix.relative(posix.dirname(output), target);
  return relative.startsWith('.') ? relative : `./${relative}`;
}

export async function emitWorkspaceDemo(repo, output, example) {
  const pkg = JSON.parse(await readFile(join(repo, 'package.json'), 'utf8'));
  const [htmlSource, cssSource, jsSource] = example.source;
  const htmlOutput = `demo/${example.demo}`;
  const cssOutput = htmlOutput.replace(/\.html$/, '.css');
  const jsOutput = htmlOutput.replace(/\.html$/, '.mjs');
  const [html, css, js] = await Promise.all(
    [htmlSource, cssSource, jsSource].map((file) => readFile(join(repo, file), 'utf8')),
  );
  const htmlAsset = (source) => `./${posix.relative(posix.dirname(htmlSource), source)}`;
  const localAsset = (file) => `./${posix.basename(file)}`;
  const cssLink = `href="${htmlAsset(cssSource)}"`;
  const jsLink = `src="${htmlAsset(jsSource)}"`;
  if (!html.includes(cssLink) || !html.includes(jsLink)) {
    throw new Error('Workspace must link its canonical stylesheet and module');
  }
  const demoHTML = html
    .replace(cssLink, `href="${localAsset(cssOutput)}"`)
    .replace(jsLink, `src="${localAsset(jsOutput)}"`);
  const demoCSS = css.replace(
    /@import (['"])(@ponchia\/ui(?:\/[^'"]+)?)\1;/g,
    (_, quote, specifier) =>
      `@import ${quote}${publicAsset(pkg, specifier, '.css', cssOutput)}${quote};`,
  );
  const demoJS = js.replace(
    /from (['"])(@ponchia\/ui(?:\/[^'"]+)?)\1/g,
    (_, quote, specifier) => `from ${quote}${publicAsset(pkg, specifier, '.js', jsOutput)}${quote}`,
  );
  // This adapter supports only the fixture's static CSS imports and JS import-from
  // statements. New syntax must be handled deliberately, never shipped unresolved.
  if (demoHTML.includes('./src/') || /@ponchia\/ui/.test(demoCSS + demoJS)) {
    throw new Error('Workspace contains an unsupported asset or package import');
  }
  await Promise.all(
    [
      [htmlOutput, demoHTML],
      [cssOutput, demoCSS],
      [jsOutput, demoJS],
    ].map(([file, content]) => writeFile(join(output, file), content)),
  );
}
