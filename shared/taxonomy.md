# Step 0 — discover the repo's taxonomy (every verb runs this first)

D³ is repo-agnostic. Never hardcode one repo's paths; learn them at runtime, quietly, and report what
you loaded — not raw file contents.

1. **Root.** `git rev-parse --show-toplevel`, else the working directory.
2. **`docs/README.md`** — if present, it is the source of truth for this repo's folder taxonomy,
   frontmatter, status lifecycle and per-folder README convention. **The repo wins over every D³
   default in these files.**
   - A YAML fence after a `<!-- docs-check:vocabulary -->` marker is the **closed list** of `type:` and
     `status:` values (plus the D³ `checks:`, `modules:`, `citation-aliases:` and `evidence-allow:`
     keys). Never write a value outside it.
   - Note the templates folder it names (default `docs/templates/`) and the docs-check command
     (default `node tools/docs-check/check.mjs`).
   - Note any progress log or roadmap it names — follow-through updates those.
3. **Agent contract.** Read the root `AGENTS.md` and/or `CLAUDE.md` if present: build/test commands,
   non-negotiable conventions, the list of nested module contracts (`*/CLAUDE.md`, `*/AGENTS.md`,
   `.claude/rules/*.md` with `paths:`), and any rule like "no undocumented work". Module rules
   override general ones.
4. **Optional integrations** — only if present, see [integrations.md](integrations.md).
5. **Fallback** — if `docs/README.md` is absent, use the default taxonomy below and say so. Suggest
   `/d3:init` once; never scaffold silently.

## Default taxonomy (when the repo defines none)

Folders follow [Diátaxis](https://diataxis.fr/) — tutorial, how-to, reference, explanation — with
plans, specs and legacy material as project records outside it.

| Kind of knowledge | Home | `type:` |
|---|---|---|
| Future work (feature, migration, refactor) | `docs/plans/{module}/{kebab}/README.md` | `plan` |
| Product spec (optional PRD) | `docs/specs/NNN-{kebab}/spec.md` | `spec` |
| Architectural decision | `docs/architecture/decisions/adr-NNNN-{kebab}.md` | `adr` |
| Architecture view (arc42 / C4) | `docs/architecture/views/{kebab}.md` | `architecture` |
| Runtime flow | `docs/architecture/flows/{kebab}.md` | `flow` |
| How a module works today | `docs/reference/modules/{module}.md` | `reference` |
| Domain, pricing or entitlement rule | `docs/reference/business-rules/{domain}.md` | `reference` |
| Algorithm (wrong edit costs money or visibility) | `docs/reference/algorithms/{kebab}.md` | `algorithm` |
| Domain model (class diagrams, status state machines) | `docs/reference/domain/{context}.md` | `reference` |
| Data model notes (beside a generated ER diagram) | `docs/reference/generated/data-model/{context}.notes.md` | `data-model` |
| Threat model (STRIDE, one surface) | `docs/reference/security/threat-models/{surface}.md` | `threat-model` |
| Glossary term | `docs/reference/glossary.md` (one `###` entry) | `glossary` |
| Shipped bug / parity finding | `docs/reference/audits/YYYY-MM-DD-{kebab}.md` — dated, immutable | `audit` |
| Production incident | `docs/reference/incidents/{kebab}.md` | `incident` |
| Operational procedure | `docs/runbooks/{kebab}.md` | `runbook` |
| Developer how-to | `docs/guides/{kebab}.md` | `guide` |
| Learning path | `docs/guides/tutorials/{kebab}.md` | `tutorial` |
| Retiring system | `docs/legacy/` | `legacy` |

## Status lifecycles

- Default: `draft → in-review → active → implemented → deprecated`. `implemented` means **in
  production**; code-complete but undeployed stays `active`.
- ADRs (MADR): `proposed → accepted → superseded | deprecated`, or `rejected`.
- Audits: `active` while findings stand, `resolved` when all are closed. Incidents: `active → resolved`.
- Detail one word cannot carry goes in `status-note:`.

## Never invent repo facts

If a bucket, plan, doc or enum does not exist, say so — don't cite a path you haven't confirmed.
Cross-repo work (an API endpoint plus a mobile screen) gets a plan in each repo, with reciprocal
`related:` links; file it in the repo it primarily changes.
