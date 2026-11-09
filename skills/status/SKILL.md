---
name: status
description: "Summarizes the state of a repo's docs: plans and specs by status with open acceptance criteria, docs past their review date, incidents with open action items, undocumented modules and implemented plans not yet graduated to current-state docs. Read-only. Use when the user runs /d3:status or asks what is in flight or what docs need attention."
argument-hint: ""
---

# /d3:status

Read-only. Shared rules, relative to this skill's directory: [taxonomy](../../shared/taxonomy.md) ·
[integrations](../../shared/integrations.md).

1. **Taxonomy** — Step 0 in `../../shared/taxonomy.md`.
2. **Plans and specs** — read `docs/plans/README.md` if present (its tables are the map); otherwise
   read the frontmatter of `docs/plans/**/README.md` and `docs/specs/*/spec.md`. Group
   `active → in-review → draft`, then a count of `implemented`. For each live plan: title, module,
   status, `status-note`, and how many acceptance criteria / tasks are still open.
3. **Needs attention** — run the checker (repo copy, else
   `<this skill's directory>/../../tools/docs-check/check.mjs --root <repo>`), never by hand:
   - `check.mjs review-due` — living docs past their review date, oldest first, with owner.
   - `check.mjs --json` — counts of errors, live plans without acceptance criteria, drifted citations,
     unowned incident action items, uncovered modules, and (if enabled) ungraduated plans.
4. **Open TODOs** from integrations that exist (progress section, session log).
5. **Print** a compact summary; cap each list at 20 lines and give totals. Don't paste plan bodies.
