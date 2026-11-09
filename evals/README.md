# Evals

Behaviour tests for the D³ skills, run with Claude Code's eval harness
([docs](https://code.claude.com/docs/en/plugin-evals.md)). Each case is a `case.yaml` (schema 1.1)
plus a `fixture.sh` that builds a tiny repo with a `docs/` corpus in the run's empty workspace.

## Run

```bash
# with and without the plugin, to see what it adds over a cold agent
claude plugin eval . --scaffold --ablation with-without --trust-plugin

# one case, one run, cheaply
claude plugin eval . --scaffold --case review-flags-rule-violation --runs 1 --ablation none --model sonnet
```

`--scaffold` is required: it runs each case's `fixture.sh` (author-written Bash, as you). Results go to
`evals/results/` (git-ignored).

## Cases

| Case | Verb | What it proves |
|---|---|---|
| `help` | — | Bare `/d3:d3` prints usage and touches nothing. |
| `init-dry-run-first` | init | Shows create / skip / append before writing; keeps an existing `CLAUDE.md`; no overview in `AGENTS.md`. |
| `init-existing-report-only` | init | A repo that already has a docs system is reported on, never scaffolded over. |
| `prime-surfaces-business-rule` | prime | Loads the governing rule and the active plan as a compact pack, not a dump. |
| `prime-fallback-no-docs` | prime | With no `docs/README.md`, uses the D³ default and cites no doc that doesn't exist. |
| `prime-diff-picks-cited-docs` | prime | `--diff` loads the doc that cites the changed file, not an unrelated one. |
| `answer-from-docs` | prime | A "how does X work and why" question is answered from the doc — including the why the code can't show. |
| `capture-bug-routing` | capture | A bug goes to a dated, immutable audit; files confirmed before writing; ADRs untouched. |
| `capture-plan-acceptance` | capture | A plan gets numbered Given/When/Then acceptance criteria and invents no product facts. |
| `capture-adr-numbering` | capture | With ADRs 0001, 0002, 0005, the next is 0006. |
| `capture-adr-supersede` | capture | Replacing a decision writes a new ADR; the old one gets only the `superseded-by` pointer. |
| `capture-incident-action-items` | capture | Blameless postmortem with owned action items; owners asked for, not invented. |
| `spec-no-invention` | spec | FR/SC ids and prioritized stories; price, quotas and metrics become `[NEEDS CLARIFICATION]`. |
| `review-flags-rule-violation` | review | A diff that contradicts a business rule is caught, quoted, and flagged as undocumented work — read-only. |
| `check-runs-the-linter` | check | Runs `check.mjs` and reports its findings instead of eyeballing files. |

Write tools are allowed in the write-verb cases on purpose: a skill that writes without asking would
then actually write, and the grader fails it.

## Adding a case

Create `evals/<name>/case.yaml` with `schema_version: "1.1"`, `name`, `execution.prompt`, and an `llm`
grader whose `criteria` say what PASS means; put the workspace files in `fixture.sh` and point
`context.scaffold_script` at it. Extra rubric graders go in `graders/*.md` (frontmatter `type: llm`).
