const TEXT_FILE =
  /\.(?:css|html|[cm]?js|jsx|[cm]?ts|tsx|d\.[cm]?ts|json|md|map|ya?ml|txt|toml|svg)$/i;
const SOURCE_FILE = /\.(?:css|[cm]?js|jsx|[cm]?ts|tsx|d\.[cm]?ts)$/i;

const PUBLIC_SOURCE_NOTE_PATTERNS = Object.freeze([
  [
    'internal quality-audit marker',
    new RegExp(String.raw`\b${['code-quality', 'audit'].join(' ')}\b`, 'i'),
  ],
  [
    'internal component audit marker',
    new RegExp(String.raw`\b${['component', 'audit'].join('-')}\b`, 'i'),
  ],
  ['internal review ticket marker', /\breview (?:C|Q)\d+\b/i],
  ['internal audit ticket marker', /\baudit (?:C|Q)\d+\b/i],
  // Bare `(Q1)` often means a calendar quarter in examples; quality-review
  // shorthand is already caught by the explicit review/audit patterns above.
  ['internal audit ticket shorthand', /\(C\d+\.?\)/],
  [
    'internal forensic wording',
    new RegExp(String.raw`\b${['silently', 'diverged'].join(' ')}\b`, 'i'),
  ],
]);

export const isPublicTextFile = (rel) => TEXT_FILE.test(rel);

export const isRepositorySourceFile = (rel) => SOURCE_FILE.test(rel);

export const publicSourceNoteProblems = (source) =>
  PUBLIC_SOURCE_NOTE_PATTERNS.filter(([, pattern]) => pattern.test(source)).map(([label]) => label);
