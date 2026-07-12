![Document-Driven Development (D³)](assets/banner.svg)

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![version](https://img.shields.io/badge/version-1.0.1-5fc9bf)](CHANGELOG.md)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-9d8cff)](https://docs.claude.com/en/docs/claude-code)
[![skills](https://img.shields.io/badge/skills-prime%20·%20capture-5fc9bf)](#usage)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](#contributing)

> **Documentation isn't a byproduct of the work — it's the interface your AI works through.**

Most AI coding sessions start cold. The agent knows the *code* but not the *why* — the
business rules, the decisions already made, the bug you root-caused last month. That
knowledge lives in one person's head and evaporates between sessions. **D³** is a two-verb
workflow that keeps it in the repo, in a shape the agent reads on the next task: **`prime`**
loads the few docs that matter *before* you build, and **`capture`** files what you learned
into its one canonical home *after* — so nothing is ever learned twice.

---

## Example session

> *Illustrative* — a realistic transcript of the loop on a real feature. Paths and docs
> are discovered from the repo at runtime.

```text
> /d3:d3 prime "add tier-based ad limits"

Context pack for: add tier-based ad limits
Taxonomy:   docs/README.md found (repo's own six-bucket layout)
CLAUDE.md:  root + src/modules/ads/CLAUDE.md   (module rules override general ones)
Docs loaded:
  - docs/reference/business-rules/membership.md   [active]   — Free=3 active ads, Silver=15,
                                                               Gold=unlimited; boost resets weekly
  - docs/plans/ads/posting-limits/README.md        [active]  — the plan this task executes
  - docs/architecture/decisions/adr-0012-entitlement-checks.md [accepted]
                                                              — entitlements gate at the command handler, not the UI
Graph:      graphify query "what enforces AdLimit" → AdQuotaService.Guard()
Last session: wired MembershipTier enum into the ad-create validator (.remember/recent.md)
Open TODOs:  none for ads/ in CLAUDE.md Progress

Proceeding with this context in hand…
```

```text
> /d3:d3 capture --bug "Gold users hit the Free 3-ad cap because tier defaulted to Free on a null claim"

Filed → docs/reference/audits/2026-07-13-gold-tier-defaults-to-free.md  (dated · IMMUTABLE)
  Symptom (verbatim), root cause at AdQuotaService.cs:74, fix + files changed,
  what was NOT touched (the enum), numbered verification steps.

Follow-through (same change set):
  ✓ docs/reference/audits/README.md        — indexed the new audit row
  ✓ docs/reference/business-rules/membership.md — added the null-claim caveat, cited to :74
  ✓ CLAUDE.md Progress                     — logged the fix
  ✓ .remember/today-2026-07-13.md          — one-line session note
  ↻ suggest: graphify update .             — refresh the knowledge graph

No undocumented work. The next `prime` for anything tier-related will surface this.
```

---

## Features

- **`prime` = context economy** — loads the 3–6 docs that actually matter (root + module
  `CLAUDE.md`, the governing ADR, the business rule, the relevant plan, last session's note)
  as a focused pack, not a dump.
- **`capture` = one home per fact** — every kind of knowledge routes to exactly one
  canonical location by document type. No duplicates, no "where did we write that down?"
- **Repo-agnostic auto-discovery** — reads your `docs/README.md` + `CLAUDE.md` at runtime to
  learn *your* taxonomy; falls back to a standard six-bucket layout when there isn't one yet.
- **Immutable ADRs & audits** — decisions are superseded, never rewritten; bugs are dated
  files you never edit. The history *is* the record.
- **No-undocumented-work follow-through** — after a capture it updates the folder index, the
  plans roadmap, the progress tracker, and the session log automatically.
- **Zero config** — it's a skill. Install it and invoke it. Optional integrations (a
  knowledge graph, a `.remember` session log, Cursor rules) are used only when present.

---

## Install

```text
/plugin marketplace add abuammarsami/d3
/plugin install d3@ammar-skills
```

Reload plugins (`/reload-plugins`) if prompted.

---

## Usage

Installed plugin skills are namespaced by plugin name, so the command is **`/d3:d3`**:

```text
/d3:d3 prime <task or feature>    # load the right docs for this task → a context pack
/d3:d3 capture <what happened>    # file a new rule / decision / bug in its canonical home
/d3:d3 status                     # what's active/draft across docs/plans (+ open TODOs)
/d3:d3                            # help
```

> The bare `/d3` works only if you add it as a personal or project skill named `d3` (not via
> the plugin). Through the marketplace plugin, always use the namespaced `/d3:d3`.

`capture` routes by the *kind* of knowledge — pass a flag, or let it infer (it asks when
genuinely ambiguous):

| Flag | Canonical home | What it is |
|------|----------------|-----------|
| `--plan` | `docs/plans/{module}/…` | a future design, written to be executed |
| `--decision` | `docs/architecture/decisions/adr-NNNN-…` | an immutable ADR (superseded, never edited) |
| `--bug` | `docs/reference/audits/YYYY-MM-DD-…` | a dated, immutable audit: symptom → root cause → fix → verification |
| `--incident` | `docs/reference/incidents/…` | a blameless post-mortem |
| `--rule` | `docs/reference/business-rules/…` | a domain rule, cited to `file:line` |
| `--module` | `docs/reference/modules/…` | a current-state reference ("how it works today") |

---

## How it works

The docs only help if the agent actually reads them. D³ pairs a durable, type-partitioned
doc corpus with the wiring that delivers it into context at the right moment — a router
`CLAUDE.md` that links out to `docs/`, module files that auto-load per subtree, an optional
knowledge graph queried instead of grepped. The corpus becomes an **interface**, not an
archive. Every fact keys to one document type:

| Bucket | Holds |
|--------|-------|
| `docs/architecture/decisions/` | ADRs — immutable decision records |
| `docs/plans/{module}/` | feature / migration / refactor designs |
| `docs/reference/business-rules/` | money · tiers · entitlements, cited to `file:line` |
| `docs/reference/audits/` | dated, immutable bug/parity records |
| `docs/reference/incidents/` · `modules/` | post-mortems · current-state references |
| `docs/runbooks/` · `guides/` | operational procedures · developer how-tos |

`prime` reads these homes back into context; `capture` writes new knowledge where `prime`
will find it. The loop closes.

---

## Why / philosophy

Context engineering beats prompt engineering: the win isn't a cleverer prompt, it's the
right durable knowledge in the model's context at the right moment. Read the full writeup —
**[Document-Driven Development (D³): Docs Are the Interface Your AI Works Through](https://ammar-portfolio-zeta.vercel.app/deep-dives/document-driven-development)** —
for the methodology, the taxonomy, and the loop, with real examples from a production .NET
marketplace.

---

## FAQ

**Does it work in any repo?**
Yes. On every run it discovers your repo's actual `docs/` taxonomy from `docs/README.md` +
`CLAUDE.md`. It never hardcodes one project's paths.

**What if I don't have a `docs/` folder yet?**
It falls back to a standard six-bucket layout and creates folders/README indexes on the
first `capture`. You can start empty and let the corpus grow.

**Does it need graphify (or any other tool)?**
No. A knowledge graph, a `.remember` session log, and Cursor rules are *optional* — used
only when they already exist in your repo. D³ works fully without them.

**Will it edit my files without asking?**
`capture` proposes the destination and follow-through, and asks before writing when the
routing is ambiguous. It **never** edits an immutable ADR or a dated audit — to revise an
ADR it writes a new one that `supersedes:` it; to re-audit it writes a new dated file.

**Is `prime` just dumping all my docs into context?**
No — that's the whole point. It loads the 3–6 docs that matter for *this* task and
summarizes each in a line. A focused pack, not a dump.

---

## Contributing

Issues and PRs welcome — bug reports, taxonomy ideas, and integration hooks especially. Open
an issue to discuss anything larger than a fix.

## License

[MIT](LICENSE) © Md. Abu Ammar

---

⭐ **Star this repo if it saves you a cold start.**
