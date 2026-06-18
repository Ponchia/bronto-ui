import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function createTextReader(root) {
  const cache = new Map();
  return function text(rel) {
    if (!cache.has(rel)) cache.set(rel, readFileSync(resolve(root, rel), 'utf8'));
    return cache.get(rel);
  };
}

export function relExists(root, rel) {
  return existsSync(resolve(root, rel));
}

function ownerEntry(item, fallbackIncludes = []) {
  return typeof item === 'string' ? { file: item, includes: fallbackIncludes } : item;
}

export function checkOwnerProof({
  root,
  errors,
  text,
  subject,
  kind,
  items,
  fallbackIncludes = [],
  missingOwnerMessage = `${subject} has no ${kind} owner`,
  missingFileMessage = (item) => `${subject} ${kind} owner is missing: ${item.file}`,
  missingNeedleMessage = (item, needle) =>
    `${subject} ${kind} owner ${item.file} does not contain "${needle}"`,
  validateItem,
}) {
  if (!items?.length) {
    errors.push(missingOwnerMessage);
    return;
  }
  for (const raw of items) {
    const item = ownerEntry(raw, fallbackIncludes);
    validateItem?.(item);
    if (!relExists(root, item.file)) {
      errors.push(missingFileMessage(item));
      continue;
    }
    const body = text(item.file);
    for (const needle of item.includes ?? fallbackIncludes) {
      if (!body.includes(needle)) errors.push(missingNeedleMessage(item, needle));
    }
  }
}

export function withoutImportDeclarations(source) {
  return source.replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm, '');
}

export function hasWord(haystack, needle) {
  return new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(haystack);
}
