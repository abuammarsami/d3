---
name: check
description: "Runs the D³ docs linter and explains what it found: frontmatter outside the vocabulary, broken links and anchors, Mermaid that does not parse, reused ADR numbers, open questions in settled docs, live plans without numbered acceptance criteria, code citations that drifted, evidence files under docs/, incidents with unowned action items, undocumented modules, and docs past their review date. Offers safe fixes. Use when the user runs /d3:check or asks to lint, validate or check the docs."
argument-hint: "[--drift [--changed <base>]] [--review-due] [--fix]"
---

# /d3:check

The linter is deterministic and needs no AI; this skill runs it and turns its output into fixes.

1. **Find the checker** — the repo's `tools/docs-check/check.mjs` (or the command `docs/README.md`
   names). Without one, use the plugin's: `node <this skill's directory>/../../tools/docs-check/check.mjs --root <repo>`.
2. **Run** what was asked — never compute these by hand:
   - default: `check.mjs` (all checks)
   - `--drift`: `check.mjs drift`, with `--changed <base>` to limit it to code changed since a branch point
   - `--review-due`: `check.mjs review-due`
   Add `--json` when you need to process many findings.
3. **Explain** — group by check, errors first. For each kind, one line on what it means and the fix.
   Large counts: give the total and the top files, not every line.
4. **`--fix`** — propose fixes, list the files, confirm, then apply. Safe to fix: a link to a moved
   file, a status word outside the vocabulary (map it, keep the detail in `status-note`), a missing
   index row, a citation whose symbol moved (re-read the code first). **Never** edit an immutable
   record beyond a pointer or broken syntax (`../../shared/safety.md`); never mark a doc reviewed
   (`last-reviewed`) unless you actually read it against the code with the user. Re-run until no
   errors remain.

Exit codes: `0` clean, `1` errors (or warnings with `--strict`), `2` bad usage. Warnings never fail CI
unless the repo opts in (`checks:` levels in the vocabulary, or `--strict`). The full list of checks
and their configuration: `../../tools/docs-check/README.md`.
