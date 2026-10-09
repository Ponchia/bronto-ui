# Agent notes

Conventions, gates, and release mechanics live in
[CONTRIBUTING.md](CONTRIBUTING.md); repository layout in
[docs/architecture.md](docs/architecture.md). Read those first — this file
only carries maintainer doctrine that fits nowhere else.

## Doctrine

- Single consumer (the maintainer). When an audit/review surfaces a
  worthwhile fix, default to fixing it now — do not propose deferring to
  post-release backlogs unless asked.

- Maintainer-directed coding-agent commits use the configured Zeno
  Trevisan / @Ponchia Git identity. Do not add AI-assistant
  `Co-authored-by` trailers. Preserve genuine human authorship. Integrate
  reviewed Dependabot / GitHub Actions proposals on maintainer-authored
  branches, keeping links to their source PRs (see CONTRIBUTING.md →
  Commit attribution).

## House check

Run `repo-instruction-audit --repo .` after changing agent instructions or
documentation routing.
