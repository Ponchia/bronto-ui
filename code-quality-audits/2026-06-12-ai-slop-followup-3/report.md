# AI Slop Risk

- Project: `/Users/zeno/bronto/bronto-ui`
- Output: `code-quality-audits/2026-06-12-ai-slop-followup-3`
- Base: `none`
- Deep: `true`
- Mutation: `false`
- CodeQL: `false`
- Reviewer: `false`

## Diff Context
- RUN: git status
  - Command: `git status --short`
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/diff-context-git-status.log`

- RUN: git diff stat
  - Command: `git diff --stat`
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/diff-context-git-diff-stat.log`

## JavaScript/TypeScript
- SKIP: npm typecheck
  - Reason: No package.json script named 'typecheck'.

- RUN: npm lint
  - Command: `npm run lint`
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/compile-type-safety-npm-lint.log`

- RUN: npm test
  - Command: `npm run test`
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/compile-type-safety-npm-test.log`

- RUN: npm check:dead
  - Command: `npm run check:dead`
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/integration-completeness-npm-check-dead.log`

- RUN: tsc --noEmit
  - Command: `tsc --noEmit`
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/compile-type-safety-tsc-noemit.log`

- SKIP: knip
  - Reason: Covered by project-native dead-code/dependency script.

- SKIP: dependency-cruiser
  - Reason: No dependency-cruiser config detected.

- RUN: jscpd
  - Command: `jscpd --gitignore --noSymlinks --ignore '**/node_modules/**,**/.git/**,**/.jj/**,**/.ai-slop/**,**/.semgrep/**,**/.codeql/**,**/dist/**,**/build/**,**/coverage/**,**/.next/**,**/.turbo/**' scripts .github `
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/maintainability-sludge-jscpd.log`

- SKIP: spectral OpenAPI lint
  - Reason: spectral unavailable or no OpenAPI file detected.

## Security Regression
- RUN: semgrep deep
  - Command: `/Users/zeno/bronto/llm-config/tools/semgrep/scan.sh --preset deep --output code-quality-audits/2026-06-12-ai-slop-followup-3/semgrep .`
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/security-regression-semgrep-deep.log`

- RUN: gitleaks
  - Command: `gitleaks detect --source . --redact --no-banner`
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/security-regression-gitleaks.log`

- RUN: trufflehog
  - Command: `trufflehog filesystem scripts .github  --exclude-paths code-quality-audits/2026-06-12-ai-slop-followup-3/trufflehog-exclude-paths.txt --force-skip-binaries --force-skip-archives --results verified --no-update --fail`
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/security-regression-trufflehog.log`

- RUN: trivy fs
  - Command: `trivy fs --scanners vuln,secret,misconfig --severity HIGH,CRITICAL --exit-code 0 .`
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/security-regression-trivy-fs.log`

- RUN: checkov
  - Command: `checkov -d . --quiet`
  - Result: PASS
  - Log: `code-quality-audits/2026-06-12-ai-slop-followup-3/logs/security-regression-checkov.log`

## Summary

- Passed checks: 12
- Failed checks: 0
- Skipped checks: 4
