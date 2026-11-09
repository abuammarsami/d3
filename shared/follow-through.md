# Mandatory follow-through — the "no undocumented work" rule

After writing a doc, in the **same change set**:

1. **Owning folder index** — add or update the row in that folder's `README.md` table
   (doc / status / owner / last reviewed) so the doc is indexed.
2. **Plans index and roadmap** — if a plan was added or changed status, update `docs/plans/README.md`
   and the roadmap the repo keeps, if any.
3. **Progress log** — append to the progress log `docs/README.md` names (for example
   `docs/plans/progress-log/YYYY-MM.md`), if the repo keeps one. Repo-specific trackers are in
   [integrations.md](integrations.md).
4. **Frontmatter** — the new doc carries the block in [frontmatter.md](frontmatter.md), with
   `last-reviewed` set to today.
5. **Current truth** — if the captured fact changes how the system works, update the module
   reference, flow, view, rule or algorithm page that describes it in the same change set — or say
   plainly that none exists yet and which `/d3:capture` kind would create it.
6. **Graduation** — when a plan or spec moves to `implemented`, what outlives it (how the module works
   now, the rule, the flow) moves to its permanent home, which links back to the plan. Nobody should
   need to read old plans — or the code — to learn how the system works today.
7. **Run the docs check** and fix what it reports before reporting done:
   `node tools/docs-check/check.mjs` (the repo's own command if `docs/README.md` names one; else the
   plugin's copy at `../../tools/docs-check/check.mjs` from this skill's directory, with
   `--root <repo>`). Loop: check → fix → check, until no errors.
8. **Optional integrations** — session log, knowledge graph: see [integrations.md](integrations.md).

Report the destination path, every follow-through file you touched, and the check result.
