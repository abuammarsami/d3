# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2026-11-11

### Added
- `docs/guides/document-types.md`: a plain-language guide to the document types (ADR, PRD, plan,
  runbook, incident review, audit and the rest) and the question each one answers, linked from the
  README. `/d3:init` now creates a copy at `docs/guides/document-types.md` in a new repo, listed in
  the guides index.

### Changed
- README restructured in the order the most-used plugin READMEs follow: the pitch, install and the
  first three commands, a real run, how it works, what's inside (each skill linked), then reference.
  New sections: updating and uninstalling, when something goes wrong, and an FAQ entry on reasons
  that live in tickets, chat or someone's head. The film link now points at "The line nobody
  touches", with links to two more short films.

### Fixed
- The plugin icon was a 16-bit, 3.5 MB PNG that `claude plugin validate` rejected (`ICON_INVALID`);
  it is now a standard 8-bit 512 px PNG.

### Security
- `docs-check` skips symlinks: a pull request could commit one pointing outside the checkout (a CI
  runner's files) and the linter would read it and echo its lines into the CI log. `lock` refuses to
  read or write `docs/.d3/citations.lock` through a symlink.

## [2.0.0] - 2026-11-09

D³ grows from a doc-filing skill into a loop — init → prime → build → capture → check → review — for
people and any coding agent. The doc system it packages started as the Partners (bareegaree)
"Documentation 2027" programme.

### Breaking
- The single skill is split into verb skills: **`/d3:init`, `/d3:prime`, `/d3:spec`, `/d3:capture`,
  `/d3:check`, `/d3:review`, `/d3:status`**. `/d3:d3` stays as the help and routes `/d3:d3 <verb>` to
  them, so `/d3:d3 prime …` still works.
- The fallback taxonomy adds `docs/specs/`, `docs/reference/domain/`, `docs/guides/tutorials/`, and
  the views, flows, algorithms, generated, security and glossary homes.
- Personal integrations (`.remember`, graphify, Cursor progress rules, a CLAUDE.md Progress section)
  are no longer core steps; they live in `shared/integrations.md` and run only when present.

### Added
- **`tools/docs-check`** — a zero-dependency docs linter (Node 18+), ported from the Partners docs CI
  without its npm dependencies and extended with: `ids` (reused ADR/spec numbers, duplicate AC/FR/SC
  ids), `clarify`, `acceptance`, `drift` (`path#Symbol`, `path:line`, `@./path#Symbol`, links to
  `#L12`; `--changed <base>`; content fingerprints via `lock`; aliases and unique-suffix resolution),
  `evidence`, `actions`, `coverage`, `graduation`, plus `cites` and `--json`. Same 0 blocking problems
  as the original on the Partners repo. GitHub Action at the repo root (`uses: abuammarsami/d3@v2`).
- **`/d3:init`** with `tools/init/scaffold.mjs`: dry run by default, never overwrites, report-only on a
  repo that already has a docs system; writes `docs/README.md` with the machine-read vocabulary, type
  folders with indexes, templates, a lean `AGENTS.md` (+ `@AGENTS.md` in `CLAUDE.md`), a PR template
  and the docs CI workflow. `--backfill` drafts module references and *proposed* ADRs from code.
- **`/d3:review`** — a PR or branch against its plan's acceptance criteria, accepted ADRs, business
  rules and contracts; flags undocumented work and broken citations. Read-only.
- **`/d3:prime --diff`** — the docs that cite the files a branch changed.
- **`/d3:spec`** — an optional product spec (PRD) with `FR-###`, `SC-###` and `[NEEDS CLARIFICATION]`.
- **Templates** (`templates/docs/`, `templates/repo/`): the 13 Partners templates made generic, plus
  spec, guide, tutorial, AGENTS.md, CLAUDE.md, PR template, docs index and CI workflow.
  - Plans: Goals and non-goals, **numbered Acceptance criteria (Given/When/Then)**, Alternatives
    considered, Cross-cutting concerns, Tasks citing AC ids, Rollout **and rollback**, Graduation.
  - ADRs: MADR 4 with the "hard to reverse, surprising, a real trade-off" test.
  - Incidents: What went wrong, **Where we got lucky**, and an **Action items** table with owners.
- New capture kinds: `--domain`, `--runbook`, `--guide`, `--tutorial`.
- Eval cases for every verb (11 new), and CI for the linter, the scaffold and a full Mermaid parse.

### Changed
- **Plans are the primary document**; every live plan carries numbered acceptance criteria. A separate
  spec is optional.
- Citations prefer `path#Symbol` over `path:line`; historical records are not drift-checked.
- Evals updated to the current `claude plugin eval` case schema.

### Security
- The linter folds every printed value to one line and escapes annotation fields, so frontmatter or
  a file name in a pull request cannot start a GitHub workflow command.
- `--external` link checking refuses private, loopback, link-local and metadata addresses and
  re-checks every redirect hop.
  The address is checked inside the connection's own DNS lookup (no rebinding gap), and IPv4-mapped
  and NAT64 IPv6 forms are caught.
- A tracked file whose name starts with `::` cannot be read as a workflow command either.

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

[2.1.0]: https://github.com/abuammarsami/d3/releases/tag/v2.1.0
[2.0.0]: https://github.com/abuammarsami/d3/releases/tag/v2.0.0
[1.0.1]: https://github.com/abuammarsami/d3/releases/tag/v1.0.1
[1.0.0]: https://github.com/abuammarsami/d3/releases/tag/v1.0.0
