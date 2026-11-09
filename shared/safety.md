# Safety rules (every writing verb)

## Confirm before you write

A capture or scaffold touches several governance files (a new doc, folder indexes, roadmaps, progress
logs). **Before writing anything**, state the destination path and the exact list of files you will
create or modify, and proceed only after the user confirms. Never write silently. If the skill was
invoked by the model rather than typed by the user, always confirm first.

## HARD RULE — immutability

Never edit a shipped ADR, a dated audit or an incident.
- To revise a decision, write a **new ADR** that sets `supersedes:`, then stamp the old one's
  `superseded-by:` and status line — a pointer, not a rewrite.
- To re-audit, write a **new dated file**; the series of dated files is the record of progress.
- A recurrence of an incident is a new incident file.
- The only edits allowed on an immutable record: that `superseded-by` pointer, and fixing broken
  syntax (a link, a Mermaid block) the docs check reports.

## Numbers are checked, never guessed

For a new ADR (`adr-NNNN`) or spec (`NNN-`), list the existing files, take `max + 1`, and confirm the
target filename does not exist before creating it. A collision would corrupt an immutable record.
The docs check (`ids`) refuses a reused number.

## HARD RULE — evidence stays out of docs

Never commit a screenshot, a binary diagram (PNG, JPG, SVG, draw.io) or test-run output under
`docs/`. Evidence goes in the **pull request description**; the doc links the PR. Small text
measurement logs are fine. Only folders the vocabulary's `evidence-allow` names may hold images.

## Never write secrets or exploits

No secret, token, connection string, customer phone number or email, and no live exploit in any doc
or PR text. Name the configuration key, the user id or the request id — nothing more.

## Never invent

Facts in a doc come from the code, the user, or another doc you read in this session. Unknowns are
written `[NEEDS CLARIFICATION: <question>]`, never guessed.
