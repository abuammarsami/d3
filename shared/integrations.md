# Optional integrations

Each is used **only when it already exists in the repo**. D³ works fully without any of them, and
never creates them.

| If present | `prime` | `capture` follow-through |
|---|---|---|
| `graphify-out/**/graph.json` (a knowledge graph) | For structural questions ("what calls X?", "what connects X to Y?") use `graphify query` / `graphify path` / `graphify explain` instead of text search | Suggest `graphify update .` so the new doc enters the graph |
| `.remember/` (session memory) | Read `.remember/recent.md` and today's `.remember/today-*.md` for "what was done last", so you continue rather than restart | Append a one-line entry to `.remember/today-YYYY-MM-DD.md` |
| `.cursor/rules/*.mdc` (Cursor rules) | Honour the rules whose `globs` match the files in scope | If a rules file tracks progress (for example `07-progress.mdc`), update it |
| A **Progress** section in the root `CLAUDE.md` / `AGENTS.md` | Read open TODOs from it | Update it |
| `.claude/rules/*.md` with `paths:` | Load the rules whose paths match the files in scope | — |
| `drift.lock` (fiberplane/drift) | — | Run `drift check` instead of D³'s drift check |
| A docs site (MkDocs, Docusaurus, Backstage TechDocs) or wiki | — | The site/wiki links into `docs/`; never duplicate a fact there |
