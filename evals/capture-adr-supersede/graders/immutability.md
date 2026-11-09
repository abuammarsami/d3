---
type: llm
---

# Grader — a replaced decision is superseded, not rewritten

The assistant was asked to capture a decision that replaces an accepted ADR-0003.

Score PASS only if ALL hold:

1. **New record.** It proposes a new ADR file numbered 0004 (`adr-0004-<slug>.md`) whose frontmatter has
   `supersedes:` pointing at the ADR-0003 file.
2. **Pointer only.** For ADR-0003 it proposes nothing beyond `superseded-by:` (pointing at the new ADR)
   and the status word `superseded`. It must NOT rewrite, delete or "update" ADR-0003's Decision or
   body. Fail if it proposes editing ADR-0003's content.
3. **Confirms first.** It lists the files it will create or modify and waits for confirmation.

Respond with `PASS` or `FAIL` on the first line, then one sentence of justification.
