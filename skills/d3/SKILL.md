---
name: d3
description: "Document-Driven Development - prime an AI session with the right docs before you build, and capture new business rules, decisions, and bugs into their canonical home after. Use when starting a feature/bug in a repo that has a docs/ knowledge base, or when the user says /d3, 'prime', or 'capture this'."
---

# /d3

Document-Driven Development (D³) in two verbs: **prime** pulls the right docs into
context *before* you build; **capture** files whatever you learned into its one
canonical home *after*. The docs are the interface the AI works through — not a
by-product of the work, but the medium of it.

## Usage

```
/d3                                   # print this help and stop
/d3 --help                            # same as bare /d3
/d3 prime <task or feature>           # load the right docs for this task into context, output a context pack
/d3 status                            # show what's active/draft across docs/plans/** (+ open TODOs)

/d3 capture <what happened>           # classify, then route to the canonical doc (asks if ambiguous)
/d3 capture --plan <feature>          # future design      → docs/plans/{module}/{kebab}/README.md   (type: plan, status: draft)
/d3 capture --decision <choice>       # architectural fork → docs/architecture/decisions/adr-NNNN-{kebab}.md (type: adr, status: proposed)
/d3 capture --bug <symptom>           # shipped bug/parity → docs/reference/audits/YYYY-MM-DD-{kebab}.md (IMMUTABLE, dated)
/d3 capture --incident <what broke>   # production issue   → docs/reference/incidents/{kebab}.md
/d3 capture --rule <domain rule>      # money/tier/entitle → docs/reference/business-rules/{domain}.md (cited to file:line)
/d3 capture --module <module>         # current-state doc  → docs/reference/modules/{module}.md
```

## What D³ is for

One home per fact, keyed by **document type** (decision → ADR, future design → plan,
shipped bug → dated audit, production break → incident, domain rule → business-rule,
current state → module reference). Nothing is learned twice: `prime` reads the homes
back into context so the next session starts where the last one left off, and `capture`
puts new knowledge where `prime` will find it. Rule of the house: **no undocumented
work** — docs ship in the same change set as the code, never as an afterthought.

## What You Must Do When Invoked

If invoked as `/d3` or `/d3 --help` (or `-h`) with no verb, print the `## Usage` block
verbatim and stop. Do not prime, do not capture, do not scan the repo.

Otherwise dispatch on the verb: `prime` → `## prime`, `capture` → `## capture`,
`status` → `## status`. All three first run **Step 0 — discover taxonomy** so the skill
works in whatever repo it's invoked from.

### Step 0 — Discover the repo's taxonomy (always first)

The skill is repo-agnostic. Never hardcode one repo's paths — learn them at runtime:

1. Find the repo root (`git rev-parse --show-toplevel`, else cwd).
2. Read `docs/README.md` if present — it defines **this repo's** folder taxonomy,
   shared frontmatter spec, status lifecycle, and per-folder README convention. Treat it
   as the source of truth for where things live.
3. Read the root `CLAUDE.md` if present — it names the nested module `CLAUDE.md` files,
   the Progress section, the graph/graphify convention, and the "no undocumented work"
   rule. Note the section numbers you'll need to update on capture.
4. **Fallback** — if `docs/README.md` is absent, assume the standard six-bucket
   taxonomy and proceed (create folders/READMEs as needed on capture):

   | Bucket | Holds |
   |--------|-------|
   | `docs/architecture/decisions/` | ADRs (immutable decision records) |
   | `docs/plans/{module}/` | feature / migration / refactor designs, one folder per plan |
   | `docs/runbooks/` | operational / on-call procedures |
   | `docs/guides/` | developer how-tos, onboarding |
   | `docs/reference/{audits,incidents,modules,business-rules}/` | slow-changing facts |
   | `docs/legacy/` | material about a system being retired |

   Standard status lifecycle: `draft → in-review → active → implemented → deprecated`.

Do the discovery quietly. Report what you loaded, not the raw file contents.

---

## prime

Goal: load the 3–6 docs that actually matter for `<task>` and hand back a compact
**context pack** — not a dump. Read the docs, summarize why each is relevant, then build.

1. **Taxonomy** — Step 0 above (root, `docs/README.md`, fallback).
2. **CLAUDE.md chain** — load the root `CLAUDE.md`, then the nearest **nested** module
   `CLAUDE.md` for the subtree the task touches (the root file lists them, e.g. per-project
   or per-layer). Module rules override general ones; don't restate them, honor them.
3. **Classify the task** and pull its matching docs:
   - **feature / migration / refactor** → the matching plan under `docs/plans/**` whose
     scope fits; check its `status:` (prefer `active`, then `draft`), read the roadmap doc
     if one exists. If no plan exists, note that `capture --plan` should open one.
   - **money / tiers / ads / boost / entitlement domain** → the relevant
     `docs/reference/business-rules/*` doc **and** the enums reference it cites.
   - **porting legacy behavior** → the matching `docs/reference/audits/*-parity-checklist.md`
     and anything under `docs/legacy/` for the old system's shape.
   - **architectural fork** (new dependency, cross-cutting pattern, boundary change) →
     scan the ADR index in `docs/architecture/decisions/`; read the ADRs in scope and
     **respect `supersedes`/`superseded-by`** (never follow a superseded decision).
   - **ops / deploy / recovery** → the matching `docs/runbooks/*`.
4. **Follow `related:` one hop** — for each doc loaded, read the `related:` frontmatter
   links exactly one level deep. Don't recurse further.
5. **Prefer the graph over grep** — for structural questions ("what calls X?", "what
   connects X to Y?"), if `graphify-out/**/graph.json` exists, use `graphify query` /
   `graphify path` / `graphify explain` instead of text search.
6. **Recent context** — read `.remember/recent.md` (and today's `.remember/today-*.md`
   if present) for "what was done last", so you continue rather than restart.
7. **Output the context pack** — a compact block, e.g.:

   ```
   Context pack for: <task>
   Taxonomy: <docs/README.md found | fallback six-bucket>
   CLAUDE.md: root + <nested module file(s)>
   Docs loaded:
     - docs/plans/<...>/README.md            [status: active]  — why it matters
     - docs/reference/business-rules/<...>.md [active]         — the load-bearing rule
     - docs/architecture/decisions/adr-NNNN-<...>.md [accepted] — the constraint
   Graph: <used graphify query "…" | no graph.json>
   Last session: <1-line from .remember/recent.md>
   Open TODOs: <from CLAUDE.md Progress section / .cursor/rules/07-progress.mdc>
   ```

   Read, don't dump: summarize each doc in a line. Then proceed to the actual work with
   this context in hand.

---

## capture

Goal: file new knowledge in its **one canonical home**, apply standard frontmatter, and
do the mandatory follow-through so the fact is discoverable by the next `prime`.

Pick the destination by the *kind* of knowledge (use the flag if given; otherwise infer,
and if genuinely ambiguous, ask which one). Route table:

| Kind of knowledge | Canonical destination | Frontmatter defaults | Template / shape |
|-------------------|-----------------------|----------------------|------------------|
| **Future design** (feature, migration, cross-cutting change) | `docs/plans/{module}/{kebab}/README.md` (single README for small; folder w/ `runbook.md`+`status.md` for large) | `type: plan`, `status: draft` | TL;DR → Why it exists → Scope → Design/Architecture → Rollout → Test plan → Open questions → References |
| **Architectural decision** (fork, new dep, boundary/pattern choice) | `docs/architecture/decisions/adr-NNNN-{kebab}.md` — **next chronological NNNN**, 4-digit | `type: adr`, `status: proposed` (`accepted` once decided) | Status → Context → Decision → Consequences (Positive/Negative/Neutral) → Alternatives considered → References. **If it replaces an older ADR:** set `supersedes:` here, and stamp the old ADR's `superseded-by:` + Status line. |
| **Shipped bug / parity fix** | `docs/reference/audits/YYYY-MM-DD-{kebab}.md` — **dated, IMMUTABLE** | `type: reference`, `status: active` | Purpose + immutability note → **verbatim** Symptom (quote the report) → Root cause at `file:line` + "why only here / why {env} only" → Fix + **files changed** + **what was NOT touched (and why)** + backfill script if data was corrupted → **numbered** Verification steps |
| **Production incident / outage** | `docs/reference/incidents/{kebab}.md` | `type: reference`, `status: resolved` | Summary → Timeline (detected/triaged/mitigated/resolved) → Root cause → Contributing factors → What we changed (with PR links) → What we considered and didn't change |
| **Domain / pricing / entitlement rule** | `docs/reference/business-rules/{domain}.md` | `type: reference`, `status: active` | Model in one paragraph → rules, each **cited to `file:line`**, with the load-bearing rule in **bold** |
| **Current module state** ("how it works today") | `docs/reference/modules/{module}.md` | `type: reference`, `status: active` | How the module works *now* — not why (that's an ADR) or how it'll change (that's a plan) |

**HARD RULE — immutability:** never edit a shipped ADR or a dated audit. To revise an
ADR, write a new one that `supersedes:` it. To re-audit, write a **new dated file** — the
history of dated files is the record of progress. Same for incidents: a new occurrence is
a new file.

### Mandatory follow-through (the "no undocumented work" rule)

After writing the doc, in the **same change set**:

1. **Owning folder README** — add/update the row in that folder's `README.md` contents
   table (title / status / owner / date) so the doc is indexed.
2. **Plans index + roadmap** — if a plan was added or changed status, update
   `docs/plans/README.md` (Active vs Implemented tables) and the roadmap doc if present.
3. **Progress trackers** — update the root `CLAUDE.md` Progress section, and
   `.cursor/rules/07-progress.mdc` if that file exists.
4. **Standard frontmatter** — apply the block below to the new doc.
5. **Session log** — if a `.remember/` system exists, append a one-line entry to
   today's `.remember/today-YYYY-MM-DD.md` (and it will roll up into `recent.md`).
6. **Refresh the graph** — if `graphify-out/**/graph.json` exists, suggest running
   `graphify update .` so the new doc enters the knowledge graph.

Report the destination path, the follow-through files you touched, and (for an ADR)
the number you assigned + any doc you superseded.

---

## Frontmatter

Apply this block at the top of every captured doc (fields the repo's `docs/README.md`
defines take precedence; owner defaults to the repo's documented owner):

```yaml
---
title: <Title shown at top of doc>
type: plan | adr | runbook | guide | reference | architecture | legacy
status: draft | in-review | active | implemented | deprecated
owner: <repo owner / your name>
created: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
tags: [<domain>, <module>, ...]
related:
  - <relative path to a related doc>
supersedes: <relative path or null>
superseded-by: <relative path or null>
---
```

ADRs additionally carry `deciders: [<name>, ...]`. Audits and incidents are dated in the
filename and never edited after they ship.

---

## status

Run Step 0, then survey `docs/plans/**`:

1. Read `docs/plans/README.md` if present (its Active / Implemented tables are the map).
2. Otherwise `grep -l` the plans tree for `status: active` and `status: draft`.
3. Print a compact list: each plan's title, module, and `status:` line, grouped
   active → draft → implemented. Append open TODOs from the root `CLAUDE.md` Progress
   section and `.cursor/rules/07-progress.mdc` if present.

Summarize; do not paste whole plan docs.

---

## Notes

- **Repo-agnostic by design.** The skill discovers each repo's actual buckets from
  `docs/README.md` + root `CLAUDE.md`, and degrades gracefully to the standard
  six-bucket taxonomy when a repo has no `docs/README.md` yet. Optional integrations
  (`graphify`, `.remember`, `.cursor/rules`) are used only when present.
- Cross-repo work (an API endpoint + a mobile screen) gets a plan **in each repo** with
  reciprocal `related:` links — file a plan in the repo it primarily changes.
- Never invent repo facts. If a bucket, plan, or enum doesn't exist, say so and let
  `capture` create it — don't cite a path you haven't confirmed.
