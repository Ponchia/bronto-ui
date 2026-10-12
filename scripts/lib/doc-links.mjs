/** Translate repository Markdown links without changing query strings or fragments. */
import { posix } from 'node:path';

const repository = 'https://github.com/Ponchia/bronto-ui/blob/main/';

export function publicDocHref(source, href) {
  if (/^(?:[#/]|[a-z][a-z\d+.-]*:)/i.test(href)) return href;
  const match = /^([^?#]+)\.md([?#].*)?$/.exec(href);
  if (!match) return href;
  const [, path, suffix = ''] = match;
  const target = posix.normalize(posix.join(posix.dirname(source), path + '.md'));
  if (target.startsWith('docs/')) return path + '.html' + suffix;
  if (target === '..' || target.startsWith('../')) return href;
  return repository + target + suffix;
}
