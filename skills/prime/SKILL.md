---
name: prime
description: "Loads the 3–6 repo docs that govern a task (plan, ADRs, business rules, module reference, flow, threat model) into a compact context pack before any code is written, so the agent works from the documented rules instead of guessing from code. With --diff, picks the docs that cite the files a branch changed. Use when the user runs /d3:prime, asks to 'prime' or 'load the context' for a task, or starts work on a feature in a repo that has a docs/ folder."
argument-hint: "<task or feature> | --diff [base]"
---

# /d3:prime

Goal: hand back a compact **context pack** — the few docs that actually matter for this task, each
summarized in a line — then do the work with it in hand. Read, don't dump.

Shared rules, relative to this skill's directory: [taxonomy](../../shared/taxonomy.md) ·
[citations](../../shared/citations.md) · [integrations](../../shared/integrations.md).

## Steps

1. **Taxonomy** — run Step 0 in `../../shared/taxonomy.md`.
2. **Contract chain** — the root `AGENTS.md` / `CLAUDE.md`, then the nearest nested module contract
   for the subtree the task touches (`*/CLAUDE.md`, `*/AGENTS.md`, `.claude/rules/*.md` whose `paths:`
   match). Module rules override general ones; honour them, don't restate them.
3. **Pick the docs.** With `--diff`, go to step 3b. Otherwise classify the task and pull the matching docs:
   - **feature / migration / refactor** → the plan under `docs/plans/**` whose scope fits (prefer
     `active`, then `draft`) and its acceptance criteria; the spec it links (`spec:`), if any; the
     roadmap if one exists. No plan yet → say so; `/d3:capture --plan` opens one.
   - **money, tiers, entitlements, permissions, visibility** → the `docs/reference/business-rules/*`
     page and the `docs/reference/algorithms/*` page for the rule, plus the enum definitions they cite.
   - **architectural fork** (new dependency, cross-cutting pattern, boundary change) → the ADR index in
     `docs/architecture/decisions/`; read the ADRs in scope and **respect `supersedes` /
     `superseded-by`** — never follow a superseded decision.
   - **any change to how the system works** → the module reference (`docs/reference/modules/*`), the
     architecture view and the flow page for the request path. These are the *current* truth; a plan
     is history. If code and doc disagree, the code wins — say so in the pack, because the doc must be
     fixed in the same change.
   - **security-sensitive surface** (auth, payments, admin, callbacks, uploads) → its threat model in
     `docs/reference/security/threat-models/*` and the dated audits it links.
   - **porting legacy behaviour** → `docs/legacy/**` and any `*-parity-*` audit.
   - **ops / deploy / recovery** → the matching `docs/runbooks/*`.
   - **bug** → dated audits and incidents in the same area (has it happened before?).
   - **unfamiliar term** → its entry in `docs/reference/glossary.md`.

   **3b. `--diff [base]`** — the docs for the code a branch touched:
   1. Changed files: `git diff --name-only <base>...HEAD` plus uncommitted changes (`git diff
      --name-only HEAD`). Default base: the merge-base with `main` (or the default branch).
   2. Docs that cite them: `node tools/docs-check/check.mjs cites <file-or-folder>...` (the repo's
      copy, else `../../tools/docs-check/check.mjs --root <repo>`). It matches code citations and
      plain path mentions.
   3. Add the plan whose Tasks table names those files, and the contracts whose `paths:` match.
   4. Run `check.mjs drift --changed <base>`: citations into the changed code that no longer hold go
      in the pack as **Docs to update**.
4. **Follow `related:` one hop** — read each loaded doc's `related:` links exactly one level deep.
   Don't recurse further.
5. **Cap at 3–6 docs.** If more qualify, keep the ones closest to the code being changed and list
   the rest by path only.
6. **Recent context and integrations** — see `../../shared/integrations.md` (graph queries instead of
   grep, last session's note, open TODOs) — only when present.
7. **Output the context pack**, then proceed with the task:

```
Context pack for: <task>
Taxonomy: <docs/README.md found | D³ default (no docs/README.md — /d3:init would add one)>
Contract: AGENTS.md / CLAUDE.md + <nested module contract(s)>
Docs loaded:
  - docs/plans/<…>/README.md                 [active]   — what this task executes; open: AC-2, AC-3
  - docs/reference/business-rules/<…>.md      [active]   — the load-bearing rule, in one line
  - docs/architecture/decisions/adr-NNNN-<…>.md [accepted] — the constraint it imposes
  - docs/architecture/flows/<…>.md            [active]   — the path this change touches
Docs to update: <stale citations from drift, or "none">
Stale: <loaded docs past review-due — treat with care>
Not documented: <areas the task touches that no doc covers — capture after>
Graph: <graph query used, if a knowledge graph exists>
Last session: <one line, if a session log exists>
Open TODOs: <from a progress section or log, if one exists>
```

## Rules

- Summarize each doc in a line; never paste whole files into the reply.
- Never cite a path you have not opened in this session. If a bucket or doc does not exist, say so.
- An empty corpus is a fine answer: load the contract, say the docs are empty, and name where the work
  will be documented (`/d3:capture --plan`, `/d3:init`).
