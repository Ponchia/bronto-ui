import ts from 'typescript';

const isPackageSpecifier = (specifier, packageName) =>
  typeof specifier === 'string' &&
  (specifier === packageName || specifier.startsWith(`${packageName}/`));

export const isJavaScriptOrDeclarationFile = (file) =>
  /\.(?:[cm]?js|jsx|[cm]?ts|tsx|d\.[cm]?ts)$/i.test(file);

const stringLiteralText = (node) => {
  if (!node || !ts.isStringLiteralLike(node)) return null;
  return node.text;
};

const importTypeArgumentText = (node) => {
  if (!ts.isImportTypeNode(node) || !ts.isLiteralTypeNode(node.argument)) return null;
  return stringLiteralText(node.argument.literal);
};

const declarationModuleSpecifier = (node) => {
  if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) return null;
  return stringLiteralText(node.moduleSpecifier);
};

const importEqualsModuleSpecifier = (node) => {
  if (!ts.isImportEqualsDeclaration(node)) return null;
  const reference = node.moduleReference;
  if (!ts.isExternalModuleReference(reference)) return null;
  return stringLiteralText(reference.expression);
};

const ambientModuleSpecifier = (node) => {
  if (!ts.isModuleDeclaration(node)) return null;
  return stringLiteralText(node.name);
};

const callModuleSpecifier = (node) => {
  if (!ts.isCallExpression(node)) return null;
  const isImportCall = node.expression.kind === ts.SyntaxKind.ImportKeyword;
  const isRequireCall = ts.isIdentifier(node.expression) && node.expression.text === 'require';
  if (!isImportCall && !isRequireCall) return null;
  return stringLiteralText(node.arguments[0]);
};

const moduleSpecifierForNode = (node) =>
  declarationModuleSpecifier(node) ??
  importEqualsModuleSpecifier(node) ??
  ambientModuleSpecifier(node) ??
  importTypeArgumentText(node) ??
  callModuleSpecifier(node);

const directiveModuleSpecifiers = (sourceFile) => [
  ...(sourceFile.typeReferenceDirectives ?? []).map((ref) => ref.fileName),
  ...(sourceFile.amdDependencies ?? []).map((ref) => ref.path),
];

const jsDocTagModuleSpecifier = (tag) => stringLiteralText(tag.moduleSpecifier);

const jsDocTypeReferencesPackage = (node, packageName) => {
  let found = false;
  const visit = (child) => {
    if (found) return;
    if (isPackageSpecifier(moduleSpecifierForNode(child), packageName)) {
      found = true;
      return;
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
};

const jsDocReferencesPackage = (node, packageName) => {
  for (const doc of node.jsDoc ?? []) {
    for (const tag of doc.tags ?? []) {
      if (isPackageSpecifier(jsDocTagModuleSpecifier(tag), packageName)) return true;
      if (tag.typeExpression && jsDocTypeReferencesPackage(tag.typeExpression, packageName)) {
        return true;
      }
    }
  }
  return false;
};

const scriptKindForFile = (fileName) => {
  if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (fileName.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (
    fileName.endsWith('.ts') ||
    fileName.endsWith('.mts') ||
    fileName.endsWith('.cts') ||
    fileName.endsWith('.d.ts') ||
    fileName.endsWith('.d.mts') ||
    fileName.endsWith('.d.cts')
  ) {
    return ts.ScriptKind.TS;
  }
  return ts.ScriptKind.JS;
};

export function importsPackageSpecifier(source, packageName, fileName = 'source.js') {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindForFile(fileName),
  );
  if (directiveModuleSpecifiers(sourceFile).some((ref) => isPackageSpecifier(ref, packageName))) {
    return true;
  }
  if (jsDocReferencesPackage(sourceFile.endOfFileToken, packageName)) return true;
  let found = false;

  const visit = (node) => {
    if (found) return;

    if (jsDocReferencesPackage(node, packageName)) {
      found = true;
      return;
    }

    if (isPackageSpecifier(moduleSpecifierForNode(node), packageName)) {
      found = true;
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return found;
}

export const importsAnnotationEngine = (source, fileName) =>
  importsPackageSpecifier(source, '@ponchia/annotations', fileName);
