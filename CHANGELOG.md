# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-07-13

### Fixed
- Corrected the documented invocation to the namespaced **`/d3:d3`** form that installed
  plugin skills actually use (e.g. `/d3:d3 prime`, `/d3:d3 capture`, `/d3:d3 status`).
- Fixed the plugin manifest `$schema` reference so the marketplace/plugin metadata validates.

### Changed
- Overhauled the README for the public release: banner, badges, a full illustrative
  example session, scannable features, copy-pasteable install, the capture routing table,
  a "how it works" taxonomy, and an honest FAQ.

### Added
- `assets/banner.svg` — a static, GitHub-safe project banner.
- `evals/` — a scored eval suite (help, prime-surfaces-business-rule, prime-fallback-no-docs,
  capture-bug-routing) with hermetic fixtures and LLM-rubric graders, for
  `claude plugin eval --ablation with-without`.
- `capture` now confirms the files it will touch before writing, and checks the next ADR
  number for collisions.

## [1.0.0] - 2026-07-13

### Added
- Initial release of **Document-Driven Development (D³)** as a Claude Code skill plugin.
- **`prime`** — loads the 3–6 docs that matter for a task into a focused context pack
  before you build.
- **`capture`** — files new knowledge into its one canonical home by document type
  (plan · decision/ADR · bug/audit · incident · business-rule · module), with mandatory
  index/roadmap/progress/session-log follow-through.
- **`status`** — surveys active/draft plans and open TODOs.
- Repo-agnostic taxonomy discovery from `docs/README.md` + `CLAUDE.md`, with a standard
  six-bucket fallback; optional graphify / `.remember` / Cursor-rules integrations used
  only when present.

[1.0.1]: https://github.com/abuammarsami/d3/releases/tag/v1.0.1
[1.0.0]: https://github.com/abuammarsami/d3/releases/tag/v1.0.0
