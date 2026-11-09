---
name: capture
description: "Files new knowledge into its one canonical home in docs/ — a plan with acceptance criteria, an ADR, a dated bug audit, an incident postmortem, a business rule, a module reference, an architecture view, a flow, an algorithm, a data model, a domain model, a threat model, a runbook, a guide or a glossary term — then does the follow-through (indexes, current-state docs, docs check). Confirms the files before writing. Use when the user runs /d3:capture or explicitly asks to capture, record or document a decision, bug, incident, rule or plan."
argument-hint: "[--plan|--decision|--bug|--incident|--rule|--module|--architecture|--flow|--algorithm|--data-model|--domain|--threat|--runbook|--guide|--term] <what happened>"
---

# /d3:capture

Goal: put what was just learned where the next person — or agent — will look for it, in the shape
they expect, so nobody has to rediscover it from the code.

Shared rules, relative to this skill's directory — read the first three before writing:
[safety](../../shared/safety.md) · [taxonomy](../../shared/taxonomy.md) ·
[follow-through](../../shared/follow-through.md) · [frontmatter](../../shared/frontmatter.md) ·
[citations](../../shared/citations.md).

## Steps

1. **Taxonomy** — Step 0 in `../../shared/taxonomy.md`. The repo's `docs/README.md` homes and
   vocabulary win over the table below.
2. **Route** — by the flag, else infer from the kind of knowledge. If it is genuinely ambiguous, ask
   which one. One fact, one home: if a doc for it exists, update that doc (unless it is immutable).
3. **Gather the facts** — read the code you will cite (`path#Symbol`), the docs it touches, and the
   user's words. Quote reports verbatim. Never invent; unknowns become `[NEEDS CLARIFICATION: …]`.
4. **Template** — copy the repo's template (`docs/templates/<kind>.md`, or the one `docs/README.md`
   names). Without one, use the plugin's at `../../templates/docs/<kind>.md`. Keep its headings,
   replace every placeholder, delete the italic guidance.
5. **Confirm** — show the destination path, the full list of files you will create or modify (the
   doc plus every follow-through file), and the doc's load-bearing content **in its final form** so
   the user approves the substance, not just file names: a plan's acceptance criteria written out as
   `AC-n` Given / When / Then; an incident's Action items table (Action · Type · Owner · Ticket); an
   ADR's decision and the options it beat; an audit's symptom and root cause. Write only after the
   user says yes.
6. **Write, then follow through** — `../../shared/follow-through.md`, including the docs-check loop.
7. **Report** — destination, follow-through files touched, docs-check result; for an ADR the number
   assigned and anything superseded.

## Route table

| Flag | Knowledge | Home (default) | Template | Must have |
|---|---|---|---|---|
| `--plan` | Future work: feature, migration, refactor | `docs/plans/{module}/{kebab}/README.md` | `plan.md` | **Acceptance criteria `AC-1…`, each Given/When/Then**; non-goals; tasks that cite AC ids; rollout **and rollback**. Small change → the short form the template describes. A product question with several stakeholders → offer `/d3:spec` first |
| `--decision` | Architectural fork | `docs/architecture/decisions/adr-NNNN-{kebab}.md` (next `max+1`, 4 digits, collision-checked) | `adr.md` (MADR 4) | Passes the ADR test — **hard to reverse, surprising without context, a real trade-off** — else it is a row in the plan's Decisions table. Considered options, consequences, confirmation. Replacing one: `supersedes:` here, `superseded-by:` + status on the old one |
| `--bug` | Shipped bug or parity finding | `docs/reference/audits/YYYY-MM-DD-{kebab}.md` — **dated, immutable** | `audit.md` | Verbatim symptom; root cause cited to the code, and why only here / only now; fix + files changed + **what was NOT touched and why**; backfill if data was corrupted; numbered verification. The plan AC it broke, if any |
| `--incident` | Production break | `docs/reference/incidents/{kebab}.md` | `incident.md` | Blameless. Impact, severity, timeline, detection, root cause, what went well / wrong / **where we got lucky**, **Action items: Action · Type (prevent/mitigate/detect) · Owner · Ticket — every row owned** |
| `--rule` | Domain, pricing, entitlement rule | `docs/reference/business-rules/{domain}.md` | `business-rule.md` | Model in one paragraph; each rule cited to the code that enforces it; the load-bearing rule in **bold** |
| `--module` | How a module works today | `docs/reference/modules/{module}.md` | `module-reference.md` | Current state only — not why (ADR) or what's next (plan) |
| `--architecture` | arc42 section, C4 view, deployment | `docs/architecture/views/{kebab}.md` | `architecture-view.md` | Mermaid view + "where each element comes from" table + verified (date, commit, how) |
| `--flow` | One request or job end to end | `docs/architecture/flows/{kebab}.md` | `flow.md` | `sequenceDiagram`; step table cited per message; **every refusal** with error code and status; side effects; tests that pin it |
| `--algorithm` | A rule where one wrong edit costs money or visibility | `docs/reference/algorithms/{kebab}.md` | `algorithm.md` | Single source + every caller; invariants, each with the named test that pins it **or marked untested** |
| `--data-model` | ER notes for a bounded context | `docs/reference/generated/data-model/{context}.notes.md` (the generated `{context}.md` beside it is never hand-edited) | `data-model.md` | Column notes, enum meanings, DB-enforced invariants |
| `--domain` | Class diagram / status state machines | `docs/reference/domain/{context}.md` | — | `classDiagram` / `stateDiagram-v2`, each transition cited to the code that performs it |
| `--threat` | STRIDE for one surface | `docs/reference/security/threat-models/{surface}.md` | `threat-model.md` | Trust boundaries; each threat with a mitigation in the code or an open item; link audits, never restate them; no secrets, no live exploits |
| `--runbook` | Operational procedure | `docs/runbooks/{kebab}.md` | `runbook.md` | Paste-able steps, expected output, checks, rollback |
| `--guide` / `--tutorial` | Developer how-to / learning path | `docs/guides/{kebab}.md` / `docs/guides/tutorials/` | `guide.md` / `tutorial.md` | Exact commands; tested on a fresh clone |
| `--term` | A word the code uses | `docs/reference/glossary.md` — one `###` entry, alphabetical, no new file | `glossary-entry.md` | Definition as the *code* uses it; where in code; not to be confused with; link the rule, don't restate it. Bump the glossary's `last-reviewed` |

## Rules

- **Immutability, numbering, evidence, secrets** — `../../shared/safety.md`. These are hard rules.
- **Diagrams** are Mermaid, verified against the code — `../../shared/citations.md`.
- **Current truth** — a capture that changes how the system works also updates the module, flow, view,
  rule or algorithm page that describes it (or names which capture would create it).
- **Graduation** — capturing that a plan shipped (`status: implemented`) includes moving what outlives
  it to its permanent home, linked back to the plan.
