# Citations and diagrams

Docs only replace reading the code if every claim about the code points at the code.

## How to cite

| Form | Use for | Drift-checked as |
|---|---|---|
| `path/to/file.ext#Symbol` (or `Class.method`, `Class::method`) | **Preferred.** A function, class, constant | file exists, symbol is in it |
| `@./path/to/file.ext#Symbol` | Same, in the fiberplane/drift style | same |
| `path/to/file.ext:42` / `:42-58` | A specific statement when no symbol fits | file exists, lines within the file |
| `[text](../../src/file.ext#L42-L58)` | A clickable link to lines | file exists, lines within the file |

- Put citations in backticks (code spans). Prefer repo-root paths; a doc-relative path or a unique
  file name also resolves. Declare abbreviations (`App/` → `src/Core/App/`) in the vocabulary's
  `citation-aliases`.
- Line numbers drift with every edit; symbols survive most. `node tools/docs-check/check.mjs drift`
  finds the ones that broke, `lock` fingerprints cited code so a changed body is caught too.
- Historical records (ADRs, audits, incidents, implemented plans) are not drift-checked: their
  citations record the code *as it was*.

## HARD RULE — diagrams are text, verified against the code

Every diagram is Mermaid (`flowchart`, `sequenceDiagram`, `stateDiagram-v2`, `classDiagram`,
`erDiagram`, `C4Context` / `C4Container` / `C4Component`) in a ```` ```mermaid ```` fence. Beside it goes
a table naming the code behind every box, arrow, participant and state. Read the code (or a graph
query) before drawing — **never draw from memory or from an older doc**. Where the code and an older
doc disagree, the code wins and the older doc gets a pointer. An element you cannot cite does not go
in the diagram.
