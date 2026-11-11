---
name: init
description: "Sets up the D³ docs system in a repository: docs/README.md with the taxonomy and machine-read vocabulary, type folders with index READMEs, document templates, a plain-language guide to the document types, a lean AGENTS.md (with CLAUDE.md importing it), a pull request template, a zero-dependency docs linter and its CI workflow. Dry run first, never overwrites, and only reports on a repo that already has a docs system. --backfill then drafts module references and proposed ADRs from the existing code. Use when the user runs /d3:init or asks to set up docs for a repo."
argument-hint: "[--backfill]"
---

# /d3:init

Shared rules, relative to this skill's directory: [safety](../../shared/safety.md) ·
[taxonomy](../../shared/taxonomy.md) · [citations](../../shared/citations.md).

## Steps

1. **Dry run.** From the repo root:

   ```bash
   node <this skill's directory>/../../tools/init/scaffold.mjs --root <repo>
   ```

   It prints every file it would `create`, `copy`, `append` to (only `@AGENTS.md` into an existing
   `CLAUDE.md`) or `skip` because it exists. It writes nothing.
   - If it says the repo **already defines a docs system**, stop there: report what it lists as
     missing and suggest the specific `/d3:capture` (or a copy from `../../templates/`) for each. Never
     scaffold over an existing system.
2. **Show the list and confirm.** Say plainly that existing files are left as they are.
3. **Apply** — the same command with `--apply` (add `--owner "<name>"` if `git config user.name` is
   not the right owner).
4. **Fill in `AGENTS.md`** with the user: the real build, test and lint commands (read them from
   `package.json`, `*.csproj`, `pyproject.toml`, `Makefile`, `go.mod`… and ask when unsure — never
   guess), and the conventions an agent would get wrong. **No project overview**: it measurably makes
   agents worse; the docs hold that.
5. **Check** — `node tools/docs-check/check.mjs`; it must report 0 errors.
6. **Next steps** to tell the user: list the source modules under `modules:` in `docs/README.md`'s
   vocabulary to turn on coverage; open the first plan with `/d3:capture --plan`; run `--backfill` to
   document the existing code.

## `--backfill` — document the code that already exists

For a repo with code and few docs. Work in small batches and confirm each batch.

1. **Modules** — list the top-level source modules (or the `modules:` in the vocabulary). For each one
   with no `docs/reference/modules/*` doc, read its code and draft a module reference from the
   template: how it works today, entry points, data, dependencies, every claim cited `path#Symbol`.
   Set `status: draft` and `status-note: drafted from code by an agent; needs a human review`.
2. **Decisions** — mine implicit decisions from the code, config and git history (a framework
   choice, a data-access pattern, a boundary that is enforced). Each one that passes the ADR test
   (hard to reverse, surprising without context, a real trade-off) becomes a **`proposed`** ADR,
   never `accepted` — a human decides.
3. **Rules** — money, pricing, entitlement and permission logic becomes a business-rule page, each
   rule cited to the code that enforces it.
4. **Glossary** — terms the code uses that a newcomer would not know.
5. Follow through and run the docs check after each batch (`../../shared/follow-through.md`).

Never put a generated overview in `AGENTS.md`, and never mark a backfilled doc `active` yourself.
