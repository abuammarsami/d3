---
title: "ADR-0001: One skill per verb, shared rules in one place"
type: adr
status: accepted
owner: Md. Abu Ammar
created: 2026-11-09
last-reviewed: 2026-11-09
deciders: [Md. Abu Ammar]
tags: [adr, skills, packaging]
related:
  - ../../plans/d3/v2/README.md
supersedes: null
superseded-by: null
---

# ADR-0001: One skill per verb, shared rules in one place

## Status

`accepted` (2026-11-09, Md. Abu Ammar).

## Context and problem statement

v1 was one 303-line `skills/d3/SKILL.md` holding every verb, route and rule. Every invocation loaded
all of it, which contradicts the skill's own context-economy promise, and adding `init`, `spec`,
`review` and `check` would have roughly doubled it. Anthropic's skill guidance keeps a `SKILL.md`
body well under 500 lines with detail one level away.

## Decision drivers

- Tokens loaded per invocation.
- One home per rule (no copy of the safety rules in every skill).
- Readable commands (`/d3:prime` rather than `/d3:d3 prime`).
- Back-compatibility for people who learned `/d3:d3 <verb>`.

## Considered options

1. One router `SKILL.md` with reference files.
2. One skill per verb, shared rules in `shared/`, `/d3:d3` kept as help and router.
3. Keep the single file.

## Decision outcome

**Chosen: option 2**, because it gives the shortest skills and the clearest commands while keeping
each rule in exactly one file. Each verb skill (`skills/<verb>/SKILL.md`, under ~80 lines) links the
shared rules it needs by a path relative to its own directory (`../../shared/safety.md`). `/d3:d3`
prints the help and routes `/d3:d3 <verb>` to the verb skill, so the v1 form still works.

### Consequences

- **Good:** each invocation loads one short skill plus only the shared files it opens.
- **Bad:** a skill depends on files outside its own folder; moving `shared/` breaks every skill.
- **Neutral:** eight skills appear in the skill list instead of one.

### Confirmation

Headless smoke runs of `/d3:d3`, `/d3:prime`, `/d3:capture` and `/d3:review` read the shared files
(2026-11-09); the evals in `evals/` exercise every verb.

## More information

- Plan: [D³ v2](../../plans/d3/v2/README.md).
