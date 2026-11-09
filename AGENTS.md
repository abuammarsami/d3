# D³ — agent guide

## Commands

- Install: nothing to install — the linter and the scaffold are zero-dependency Node (18+).
- Test: `node --test tools/docs-check/test/*.test.mjs tools/init/test/*.test.mjs`
- Docs check (this repo's own docs): `node tools/docs-check/check.mjs`
- Full Mermaid parse: `cd tools/docs-check && npm install --no-save mermaid@11 jsdom@26`, then the check (never commit `node_modules/`)
- Plugin manifest: `claude plugin validate .`
- Behaviour evals: `claude plugin eval . --scaffold --ablation with-without --trust-plugin --allow-tools "Bash(node:*)" "Bash(git:*)" Write Edit`

## Conventions an agent would get wrong

- `tools/docs-check` and `tools/init` must stay **dependency-free**. They are copied into other people's repos and run in CI with no `npm install`. Optional extras (Mermaid's full parser) load only if present.
- `templates/repo/docs-README.md` carries the default vocabulary **verbatim** from `tools/docs-check/src/vocabulary.mjs`; a test fails if they differ. Change both together.
- Skills reference shared rules and tools by paths relative to their own directory (`../../shared/…`, `../../tools/…`). Keep each `SKILL.md` short; shared rules go in `shared/`, once.
- Nothing personal in the core: integrations (graphify, `.remember`, Cursor rules) live only in `shared/integrations.md`, phrased "if present".
- The repo's own `docs/README.md` ignores `templates/` (those files are written for other repos); the CI scaffold job checks them in a fresh repo instead.
- Linter output is attacker-influenced in CI (it echoes frontmatter and paths from pull requests): print through `say()`, escape annotation fields, never print a raw multi-line value.

## Never

- Commit a secret, a token, or a customer's personal data — in code, config, docs, eval fixtures or a PR.
- Make a write verb (`init`, `capture`, `spec`, `check --fix`) write before the user confirms the file list.

## Documentation is part of the change

- Docs live in [`docs/`](docs/README.md); the map of what goes where is `docs/README.md`.
- Before working on a feature, read its plan in `docs/plans/` and the decisions (ADRs) it links.
- A change that alters behaviour updates the doc that describes it, in the same pull request — here that usually means a skill, the linter README, the README or the CHANGELOG.
- New knowledge goes to its one home: a decision → an ADR, a shipped bug → a dated audit.
- Run the docs check and the tests before you open a pull request.

## Pull requests

- Fill in the PR template: the plan, the acceptance criteria it satisfies, the docs it updated.
- One task per pull request.
