---
model: haiku
---

# Grader — prime produced a useful, compact context pack

You are grading the assistant's response to a request to load context for adding
"tier-based ad posting limits" to a repo whose fixture contains a `CLAUDE.md` router and a
small `docs/` corpus (a membership business-rule and an active posting-limits plan).

Score PASS only if ALL of the following hold:

1. **Right rule surfaced.** The response identifies the membership business rule and states
   its substance — that the tier is granted by admin approval (payment ≠ activation) and
   that `PerMonthTotalPost` is the monthly ad-post quota the new limit must enforce.
2. **Right plan surfaced.** It references the active plan for enforcing per-tier posting
   limits (`docs/plans/ads/posting-limits`), ideally noting its `active` status.
3. **Taxonomy discovered.** It shows it read the repo's own layout (from `docs/README.md`)
   and the root `CLAUDE.md`, rather than guessing.
4. **Compact, not a dump.** It summarizes each doc in about a line and hands back a focused
   "context pack." It must NOT paste the full text of the fixture files. A response that
   dumps whole files, or that pads with irrelevant docs, FAILS.
5. **Grounded.** It does not invent doc paths, rules, or numbers that aren't in the fixture.

Respond with `PASS` or `FAIL` on the first line, then one sentence of justification.
