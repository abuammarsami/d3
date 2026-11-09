---
title: "ADR-0002: Cite code by symbol and check drift deterministically"
type: adr
status: accepted
owner: Md. Abu Ammar
created: 2026-11-09
last-reviewed: 2026-11-09
deciders: [Md. Abu Ammar]
tags: [adr, citations, drift, docs-check]
related:
  - ../../plans/d3/v2/README.md
supersedes: null
superseded-by: null
---

# ADR-0002: Cite code by symbol and check drift deterministically

## Status

`accepted` (2026-11-09, Md. Abu Ammar).

## Context and problem statement

D³ docs promise that nobody has to read the code to learn how the system works, so every claim cites
the code. v1 cited `file:line`, and line numbers move on almost every edit: on the Partners repo the
first drift run found real stale line citations in living docs. A stale citation is worse than none,
because it looks authoritative.

## Decision drivers

- Works in CI with no AI and no dependencies.
- Catches the common failures: file moved, symbol renamed, lines gone, cited body changed.
- Compatible with the tools that already exist (fiberplane/drift).

## Considered options

1. `path#Symbol` (preferred) and `path:line`, checked by the D³ linter: file exists, symbol present,
   lines in range; an optional lock file fingerprints the cited code.
2. Line citations only, with no check.
3. An LLM judging whether a doc still matches the code.
4. Require fiberplane/drift (tree-sitter fingerprints).

## Decision outcome

**Chosen: option 1**, because it is deterministic, dependency-free and catches the failures that
matter most, while staying out of the way of option 4: when a repo has `drift.lock`, the D³ drift
check steps aside, and `@./path#Symbol` is accepted. Historical records (ADRs, audits, incidents,
implemented plans) are not drift-checked; their citations record the code as it was.

### Consequences

- **Good:** a renamed or deleted symbol fails the drift check on the PR that caused it.
- **Bad:** the symbol match is a word-boundary text search, not a parse. A symbol name that survives in
  a comment hides a rename. The lock file's fingerprint (the symbol's line block, to the next blank line)
  is a heuristic.
- **Neutral:** drift is a warning by default; a repo opts in to `error` in its vocabulary.

### Confirmation

`tools/docs-check/test/rules.test.mjs` pins each case (moved file, line past the end, renamed symbol,
locked body changed); the Partners parity run is recorded in the [v2 plan](../../plans/d3/v2/README.md).
