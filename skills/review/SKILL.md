---
name: review
description: "Reviews a pull request or branch against the repo's docs, read-only: which plan acceptance criteria (or spec FR/SC ids) it satisfies, whether it contradicts an accepted ADR or a business rule, whether behaviour changed with no doc updated (undocumented work), and which doc citations it broke. Ends with a verdict and the exact /d3:capture follow-ups. Use when the user runs /d3:review or asks to check a PR or branch against the plan, ADRs or docs."
argument-hint: "[PR number | branch | base]"
---

# /d3:review

A code review asks "is this code right?". This asks "does this change match what was agreed, and
does it leave the docs true?". It reads only; it never edits code or docs and never posts comments.

Shared rules, relative to this skill's directory: [taxonomy](../../shared/taxonomy.md) ·
[citations](../../shared/citations.md).

## Steps

1. **The change** — a PR number: `gh pr view <n> --json title,body,files,baseRefName` and
   `gh pr diff <n>`; a branch or base: `git diff <base>...HEAD`. Note the PR body's claimed plan and
   acceptance-criteria ids.
2. **The docs in scope** — the `--diff` steps of `../prime/SKILL.md`: docs citing the changed files
   (`check.mjs cites`), the plan (from the PR body, or the plan whose Tasks name these files), the
   accepted ADRs and business rules for the area, nested module contracts.
3. **Check, in this order:**
   1. **Acceptance coverage** — for each AC (or FR/SC) the PR claims: is there code *and* a test for
      it in the diff? Which ACs of the plan's current task are untouched?
   2. **Decisions and rules** — does any hunk contradict an `accepted` ADR (not a superseded one), a
      business rule, a module contract, or an `AGENTS.md` convention? Quote the rule and the hunk.
   3. **Undocumented work** — behaviour changed (a route, a rule, a status, a schema, a permission, an
      error code) and no doc in the diff changed. Name the doc that should have.
   4. **Broken docs** — `check.mjs drift --changed <base>` and `check.mjs` on the branch: citations
      the change invalidated, plus any docs-check errors.
   5. **Diagrams** — for each Mermaid diagram the PR adds or edits, spot-check that the cited code
      matches the boxes and arrows.
4. **Report:**

```
Review of <PR #n | branch> against docs
Plan: docs/plans/<…>/README.md — claims AC-1, AC-3
Acceptance:   AC-1 ✓ code + test  ·  AC-3 ✗ code, no test  ·  AC-2 not in this PR
Decisions:    ✓ ADR-0012 (entitlements gate at the handler)  ·  ✗ <rule> — <hunk> contradicts <quote>
Undocumented: <behaviour> changed in <file> — <doc> should change too
Docs to fix:  <stale citations / docs-check errors>
Verdict: ready | needs docs | needs changes
Follow-ups:   /d3:capture --module <m> · /d3:capture --decision "<…>"
```

Every ✗ cites the file and line of the hunk and the doc it conflicts with. No finding without a citation.
