# Frontmatter

Every doc under `docs/` starts with this block. Fields the repo's `docs/README.md` defines take
precedence; `owner` defaults to the repo's documented owner (else `git config user.name`).

```yaml
---
title: <Title shown at top of doc>      # quote it if it contains ": "
type: <a type from the vocabulary>      # plan | spec | adr | architecture | flow | reference | algorithm | data-model | threat-model | glossary | audit | incident | runbook | guide | tutorial | legacy
status: <a status allowed for that type>
owner: <person or team>
created: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
review-due: YYYY-MM-DD                  # optional; default last-reviewed + 90 days
status-note: <one line>                 # optional; the caveat a one-word status cannot carry
tags: [<domain>, <module>]
related:
  - <relative path to a related doc>
spec: <relative path or null>           # plans built from a spec
supersedes: <relative path or null>
superseded-by: <relative path or null>
---
```

- Keys are kebab-case; the docs check refuses `snake_case` and `camelCase`.
- ADRs add `deciders: [<name>, …]` (MADR also allows `consulted:` and `informed:`). An ADR's
  `last-reviewed` equals its decision date; ADRs are exempt from review.
- Audits and incidents are dated by their filename or `created` and never edited after they ship.
- When the repo's vocabulary block exists, use exactly its values. The D³ default vocabulary is in
  `tools/docs-check/src/vocabulary.mjs` (and in the `docs/README.md` that `/d3:init` writes).
