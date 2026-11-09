---
title: Document templates
type: reference
status: active
owner: <name>
created: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
tags: [templates, docs, diataxis]
related:
  - ../README.md
supersedes: null
superseded-by: null
---

# Document templates

The starting shape of every document type in [`docs/README.md`](../README.md). Copy the template to
the home the taxonomy names, replace every `<placeholder>`, and delete the guidance in *italics*. The
D³ skills (`/d3:capture`, `/d3:spec`) use these files, so a change here changes what they write.

**Rules every template carries.**

- **Frontmatter first**, with a `type:` and `status:` from the vocabulary in `docs/README.md`. The
  docs check refuses any other value.
- **Diagrams are Mermaid**, and each is **verified against the code**: a table beside it names the
  code (`path#Symbol` or `path:line`) behind every box, arrow or state. Nothing is drawn from memory.
- **No screenshots or binary diagrams.** Evidence goes in the PR description.
- **Link, don't restate.** A rule that already has a home is linked, not copied.

| Template | Use it for | Home |
|---|---|---|
| [plan.md](plan.md) | A feature, migration or refactor before it is built, with numbered acceptance criteria | `plans/{module}/{kebab}/README.md` |
| [spec.md](spec.md) | Optional: a product spec (PRD) when the what-and-why needs its own review | `specs/NNN-{kebab}/spec.md` |
| [adr.md](adr.md) | One hard-to-reverse architectural decision (MADR) | `architecture/decisions/adr-NNNN-{kebab}.md` |
| [architecture-view.md](architecture-view.md) | An arc42 section or a C4 context, container or component view | `architecture/views/` |
| [flow.md](flow.md) | One runtime flow, end to end, as a sequence diagram | `architecture/flows/` |
| [module-reference.md](module-reference.md) | How a module works today | `reference/modules/` |
| [business-rule.md](business-rule.md) | A domain, pricing or entitlement rule, each cited to the code | `reference/business-rules/{domain}.md` |
| [algorithm.md](algorithm.md) | A rule where one wrong edit costs money or visibility | `reference/algorithms/` |
| [data-model.md](data-model.md) | The hand-written notes beside a generated ER diagram | `reference/generated/data-model/{context}.notes.md` |
| [threat-model.md](threat-model.md) | STRIDE for one surface | `reference/security/threat-models/` |
| [glossary-entry.md](glossary-entry.md) | One term in the glossary | `reference/glossary.md` |
| [audit.md](audit.md) | A shipped bug or parity finding, dated and immutable | `reference/audits/YYYY-MM-DD-{kebab}.md` |
| [incident.md](incident.md) | A production incident, after it is mitigated (blameless) | `reference/incidents/` |
| [runbook.md](runbook.md) | An operational procedure | `runbooks/` |
| [guide.md](guide.md) | A developer how-to | `guides/` |
| [tutorial.md](tutorial.md) | A learning path: clone to a first traced change | `guides/tutorials/` |

Templates are checked by the docs check like any doc, except that their placeholder dates and paths
are allowed. Their Mermaid examples must parse.
