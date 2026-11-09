---
title: "<Domain> business rules"
type: reference
status: active
owner: <name>
created: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
tags: [business-rules, <domain>]
related:
  - <relative path to the plan or ADR that decided it>
supersedes: null
superseded-by: null
---

# <Domain> business rules

## In plain language

*What this domain is and who it affects, in a paragraph a non-engineer can read.*

## The model

*One paragraph: the entities involved, how they relate, and the lifecycle they move through. Link the
enum definitions in the code (or the repo's enums reference) instead of listing their values here.*

## Rules

*Every rule is a sentence plus the `file:line` that enforces it, so a reader can check it and a change
that breaks it is found by search. The rule where one wrong edit costs money or visibility is in
**bold**.*

| # | Rule | Enforced at |
|---|---|---|
| 1 | *<rule in one sentence>* | `<path>:<line>` |
| 2 | **<the load-bearing rule>** | `<path>:<line>` |

## Edge cases and decisions

- *The case that surprised us, and the owner decision or ADR that settled it (linked).*
