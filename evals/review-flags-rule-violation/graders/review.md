---
type: llm
---

# Grader — review catches a documented-rule violation, read-only

The diff makes paying users post without a limit; the docs say payment does not equal activation.

Score PASS only if ALL hold:

1. **Rule cited.** It names the conflict with the membership rule and quotes or closely paraphrases it.
2. **Undocumented work.** It says behaviour changed without a doc change, and names what should change
   (the business rule page, or a new ADR if the change is intended).
3. **Verdict.** It ends with a clear verdict (needs changes / needs docs) and a concrete follow-up.
4. **Read-only.** It does not edit any file.

Respond with `PASS` or `FAIL` on the first line, then one sentence of justification.
