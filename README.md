# Document-Driven Development (D³)

**A Claude Code skill that treats your docs as the interface your AI works through.**

> Documentation isn't a byproduct of the work — it's the medium of it. `d3` gives an AI
> agent the right context *before* you build, and files what you learn into its one
> canonical home *after*, so nothing is ever learned twice.

Most AI coding sessions start cold: the agent knows the code but not the *why* — the
business rules, the decisions already made, the bug you fixed last month and its root
cause. That knowledge lives in one person's head and evaporates between sessions. D³ is a
two-verb workflow that keeps it in the repo, in a shape the agent reads on the next task.

- **`prime`** — before you build, pull the 3–6 docs that actually matter for this task
  (the module's rules, the relevant plan, the business rule it touches, the governing
  decision) into context. A focused context pack, not a dump.
- **`capture`** — after you learn something, file it in its one canonical home by
  *document type*: a decision becomes an ADR, a future design becomes a plan, a shipped
  bug becomes a dated immutable audit, a domain fact becomes a business rule.

It is **repo-agnostic**: on every run it discovers the repo's own `docs/` taxonomy from
`docs/README.md` + `CLAUDE.md`, and falls back to a sensible six-bucket layout when a repo
doesn't have one yet. Optional integrations (a knowledge graph, a session-memory log,
Cursor rules) are used only when they're present.

## Install

```
/plugin marketplace add abuammarsami/d3
/plugin install d3@ammar-skills
```

Then reload plugins (`/reload-plugins`) if prompted.

## Use

```
/d3 prime <task or feature>     # load the right docs for this task, get a context pack
/d3 capture <what happened>     # file a new rule / decision / bug in its canonical home
/d3 status                      # show what's active/draft across docs/plans
/d3                             # help
```

`capture` routes by the kind of knowledge (or take the flag):

| Flag | Goes to | As |
|------|---------|-----|
| `--plan` | `docs/plans/{module}/…` | a design written to be executed |
| `--decision` | `docs/architecture/decisions/adr-NNNN-…` | an immutable ADR (superseded, never edited) |
| `--bug` | `docs/reference/audits/YYYY-MM-DD-…` | a dated, immutable audit (symptom → root cause → fix → verification) |
| `--incident` | `docs/reference/incidents/…` | a blameless post-mortem |
| `--rule` | `docs/reference/business-rules/…` | a domain rule cited to `file:line` |
| `--module` | `docs/reference/modules/…` | current-state reference |

After any capture it does the follow-through automatically — updates the folder's index,
the plans roadmap, the progress tracker, and the session log — so the knowledge is
discoverable by the next `prime`. The house rule it enforces: **no undocumented work.**

## Why it works

The docs only help if the agent actually reads them. D³ pairs a durable, type-partitioned
doc corpus with the wiring that delivers it into the model's context at the right moment —
a router `CLAUDE.md` that links out to `docs/`, module files that auto-load per subtree, an
optional knowledge graph queried instead of grepped. The corpus becomes an interface, not
an archive.

Read the full writeup: **[Document-Driven Development (D³): Docs Are the Interface Your AI Works Through](https://ammar-portfolio-zeta.vercel.app/deep-dives/document-driven-development)** — the methodology, the taxonomy, and the loop, with real examples from a production .NET marketplace.

## License

[MIT](LICENSE) © Md. Abu Ammar
