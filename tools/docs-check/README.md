# docs-check

The D³ docs linter. Zero dependencies, Node 18+, runs the same on a laptop, in CI and for an agent —
no AI needed. `/d3:init` copies this folder into a repo as `tools/docs-check/`.

```bash
node tools/docs-check/check.mjs                 # every check; exit 1 on an error, warnings never fail
node tools/docs-check/check.mjs --strict        # warnings fail too
node tools/docs-check/check.mjs review-due      # living docs past their review date (report only)
node tools/docs-check/check.mjs drift --changed origin/main   # citations into code changed since main
node tools/docs-check/check.mjs cites src/billing             # which docs describe this code?
node tools/docs-check/check.mjs lock            # fingerprint cited code (docs/.d3/citations.lock)
node tools/docs-check/check.mjs --json          # machine-readable, for agents and bots
```

Options: `--root <dir>`, `--today YYYY-MM-DD`, `--only frontmatter,links`, `--external` (fetch
external URLs, warnings only). Exit codes: `0` clean, `1` errors (or warnings with `--strict`),
`2` bad usage.

## What it checks

| Check | Level | Catches |
|---|---|---|
| `frontmatter` | error | missing block or required key, a `type`/`status` outside the vocabulary, unreal or out-of-order dates, snake_case keys, a dangling `related` / `supersedes` / `superseded-by` / `spec` path, a superseded ADR with no successor, a BOM |
| `links` | error | a relative link to a file or folder that does not exist (case-sensitive, as on GitHub), a `#anchor` no heading produces, a climb above the repo root — in `docs/`, every `CLAUDE.md` / `AGENTS.md` / `README.md`, and `database/**/*.md` |
| `mermaid` | error | a diagram Mermaid refuses (full parse when `mermaid` + `jsdom` are installed, else the diagram header only) |
| `ids` | error | an ADR or spec number used twice; an `AC-n` / `FR-nnn` / `SC-nnn` / `Tnnn` defined twice in one doc |
| `clarify` | error | an open `[NEEDS CLARIFICATION …]` in a doc that is `active`, `accepted` or `implemented` |
| `acceptance` | configurable (warn) | a live plan (`draft`/`in-review`/`active`) with no `## Acceptance criteria` section of numbered `AC-n` items, and no `spec:` link |
| `drift` | configurable (warn) | a citation (`path:12`, `path:12-20`, `path#Symbol`, `@./path#Symbol`, a link to `file#L12`) whose file is gone, whose lines are past the end, whose symbol is not in the file, or (with a lock) whose code changed. Historical records are skipped; their citations are history |
| `evidence` | configurable (warn) | an image, binary diagram or video under `docs/` outside `evidence-allow` — evidence goes in the PR |
| `actions` | configurable (warn) | an incident with no Action items table, or an action item with no owner |
| `coverage` | configurable (warn) | a module listed in `modules:` with no current-state doc |
| `graduation` | configurable (off) | an implemented plan that no current-state doc (module, flow, view, rule) links to |
| `review-due` | report | a living doc past `review-due`, or `last-reviewed` + the default period |

## Configuration

Everything is read from the `<!-- docs-check:vocabulary -->` YAML block in `docs/README.md`, so the
taxonomy people read and the one CI enforces are the same text. With no block, the D³ default in
[`src/vocabulary.mjs`](src/vocabulary.mjs) applies. The D³ keys beyond the base schema:

```yaml
checks: { acceptance: warn, drift: warn, evidence: warn, actions: warn, coverage: warn, graduation: off }
evidence-allow: [docs/design-handoff/]
modules: [src/billing, src/ads]          # or [{ path: src/ads, doc: docs/reference/modules/ads.md }]
citation-aliases: { "App/": "src/Core/MyApp.Application/" }
```

A citation that gives a shortened path resolves when exactly one tracked file ends with it; declare
the prefix in `citation-aliases` when two files share the tail. If the repo uses
[fiberplane/drift](https://github.com/fiberplane/drift) (`drift.lock` at the root), the drift check
steps aside.

## Tests

```bash
node --test tools/docs-check/test/*.test.mjs
```

The base checks started as the Partners (bareegaree) docs CI; its suite is ported in
`test/checks.test.mjs`, and the D³ rules are in `test/rules.test.mjs`.
