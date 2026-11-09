---
title: "<Spec: the user problem, in a few words>"
type: spec
status: draft
owner: <name>
created: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
tags: [spec, <area>]
related:
  - <relative path to the plan that will build this, once it exists>
supersedes: null
superseded-by: null
---

# <Spec title>

*Optional. Write a spec (the big-tech PRD) only when the **what and why** needs its own review: several
stakeholders, a product decision, a contract other teams build against. Otherwise the plan's own
Goals and Acceptance criteria are the spec. The plan that builds this links it with `spec:` and uses
its `FR-` and `SC-` ids instead of `AC-` ids.*

## Problem

*Who has the problem, how often, and what it costs them today. Evidence, not opinion: the support
ticket quoted, the funnel number, the interview line.*

## Users

*Each user type this serves, and what they are trying to get done.*

## Goals and non-goals

- **Goals:** *outcomes, not features.*
- **Non-goals:** *what a reader might expect, and this deliberately leaves out.*

## User stories

*In priority order. P1 alone must be a useful release.*

### US1 — <title> (P1)

As a *<user>*, I want *<capability>*, so that *<outcome>*.

- Given *<state>*, when *<action>*, then *<observable result>*.
- Given *…*, when *…*, then *…*.

### US2 — <title> (P2)

As a *…*

## Requirements

*Each one testable. EARS phrasing keeps them unambiguous: "When <trigger>, the system shall
<response>"; "While <state>, …"; "If <unwanted condition>, then the system shall …".*

- **FR-001** When *…*, the system shall *…*.
- **FR-002** If *…*, then the system shall *…*.

## Success criteria

*How we will know it worked, measured after release. Technology-free.*

- **SC-001** *<metric> moves from <baseline> to <target> within <period>.*

## Edge cases

- *Empty, duplicate, concurrent, offline, partial failure, the user without permission.*

## Assumptions

- *What we take as true without proof; each is a risk if wrong.*

## Open questions

*Never guessed. Each `[NEEDS CLARIFICATION: <question> — <who answers>]` blocks the spec from `active`;
the docs check refuses one that survives.*

- [NEEDS CLARIFICATION: *…*]
