# <Project> — agent guide

<!--
Read by every coding agent (Codex, Cursor, Copilot, Gemini, Claude Code via CLAUDE.md, and others)
and useful to every new engineer. Keep it short and human-written: commands and the conventions an
agent would get wrong without being told. No project overview — the docs hold that, and generated
overviews measurably make agents worse. Delete this comment.
-->

## Commands

- Install: `<command>`
- Build: `<command>`
- Test: `<command>` (one test: `<command>`)
- Lint and format: `<command>`
- Docs check: `node tools/docs-check/check.mjs`

## Conventions an agent would get wrong

- *<The non-standard rule, and why. For example: "data access goes through X, never Y".>*

## Never

- Commit a secret, a token, or a customer's personal data — in code, config, docs or a PR.
- *<The destructive command that looks harmless here.>*

## Documentation is part of the change

- Docs live in [`docs/`](docs/README.md); the map of what goes where is `docs/README.md`.
- Before working on a feature, read its plan in `docs/plans/` and the decisions (ADRs) it links.
- A change that alters behaviour updates the doc that describes it, in the same pull request.
- New knowledge goes to its one home: a decision → an ADR, a shipped bug → a dated audit, a rule → the
  business-rules page, how a module works now → its module reference.
- Run the docs check before you open a pull request.

## Pull requests

- Fill in the PR template: the plan, the acceptance criteria it satisfies, the docs it updated.
- One task per pull request.
