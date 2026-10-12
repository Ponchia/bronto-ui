import { Marked } from 'marked';
import { JSDOM } from 'jsdom';

const markdown = new Marked({ gfm: true, breaks: false });

/** Shared GitHub-compatible heading IDs for authored Markdown and generated HTML. */
export function headingSlug(text, seen) {
  // GitHub derives IDs from rendered text, so inline code keeps characters such as
  // `<dialog>` and `_` while formatting, HTML tags and link destinations disappear.
  // https://github.com/gjtorikian/html-pipeline/blob/v2.14.3/lib/html/pipeline/toc_filter.rb
  const content = JSDOM.fragment(markdown.parseInline(text)).textContent;
  // Preserve Unicode word characters, literal hyphens and each ASCII space. Do not
  // collapse hyphens: `var(--x)` and `A & B` resolve to `var--x` and `a--b` on GitHub.
  // https://github.com/Flet/github-slugger/blob/master/script/generate-regex.js
  const base = content
    .toLowerCase()
    .replace(/[^\p{Alphabetic}\p{M}\p{Nd}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
  let slug = base;
  let suffix = 0;
  while (seen.has(slug)) slug = `${base}-${++suffix}`;
  seen.add(slug);
  return slug;
}
