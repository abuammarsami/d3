# Evals

Scored behavior tests for the `d3` skill, run with Claude Code's eval harness.

> `claude plugin eval` is in **early access**. This suite is written to the documented
> layout (`evals/**/case.yaml`, optional `graders/*.md`) and doubles as executable
> documentation of what `prime` and `capture` are supposed to do. Field names may shift
> while the feature stabilizes.

## Run

```bash
# from the repo root, with the plugin installed:
claude plugin eval d3@ammar-skills --ablation with-without --verbose

# or point at this directory directly:
claude plugin eval . --ablation with-without
```

`--ablation with-without` runs each case twice — **with** the skill and **without** it —
and reports the score delta, so you can see how much context the skill actually adds
versus a cold agent.

## What each case checks

| Case | Verb | What it proves |
|------|------|----------------|
| `help` | — | Bare invocation prints the usage block and does **not** scan or touch files. |
| `prime-surfaces-business-rule` | `prime` | For a tier/quota task, it loads the governing business rule + the active plan as a **compact context pack**, not a file dump. |
| `prime-fallback-no-docs` | `prime` | With no `docs/README.md`, it uses the six-bucket fallback and never cites doc paths that don't exist. |
| `capture-bug-routing` | `capture` | A shipped bug routes to a **dated, immutable** audit, it **confirms the files before writing**, and it never edits an existing ADR. |

Each case is hermetic: the `files:` block scaffolds a tiny repo (a `CLAUDE.md` router + a
`docs/` corpus) so the skill has something real to read. `criteria` are AND-ed; graders in
`graders/*.md` score the judgment calls.

## Adding a case

Create `evals/<name>/case.yaml` with `name`, `prompt`, `criteria`, and (for a skill that
reads files) a `files:` fixture. Add an LLM-rubric grader in `graders/*.md` when a
criterion needs judgment rather than a string match.
