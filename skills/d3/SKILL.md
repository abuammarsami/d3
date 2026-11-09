---
name: d3
description: "Document-Driven Development (D³): one docs system in the repo that people and any coding agent share, so nobody has to guess from code. Prints the help and routes /d3:d3 <verb> to the verb skills (init, prime, spec, capture, check, review, status). Use when the user runs /d3:d3 or /d3, or asks what D³ can do."
argument-hint: "[init|prime|spec|capture|check|review|status] [args]"
---

# /d3:d3

If invoked with no verb (or `--help`, `-h`), print the **Usage** block below verbatim and stop — no
repo scan, no file reads, no writes.

With a verb, follow that verb's skill exactly as if it had been invoked directly:
`init` → `../init/SKILL.md` · `prime` → `../prime/SKILL.md` · `spec` → `../spec/SKILL.md` ·
`capture` → `../capture/SKILL.md` · `check` → `../check/SKILL.md` · `review` → `../review/SKILL.md` ·
`status` → `../status/SKILL.md` (paths relative to this skill's directory). An unknown verb: print
Usage and stop.

## Usage

```
D³ — Document-Driven Development. The docs are the interface: people and agents read the same files.

  /d3:init [--backfill]          set up docs/, templates, AGENTS.md, PR template, docs CI (dry run first)
  /d3:prime <task>               load the 3–6 docs that govern a task, as a compact context pack
  /d3:prime --diff [base]        …or the docs that cite the files this branch changed
  /d3:spec <feature>             optional product spec (PRD): stories, FR/SC ids, open questions
  /d3:capture --plan <feature>   plan with numbered acceptance criteria (AC-1…), tasks, rollback
  /d3:capture --decision <fork>  ADR (MADR), next number, supersedes instead of editing
  /d3:capture --bug <symptom>    dated, immutable audit: symptom → root cause → fix → verification
  /d3:capture --incident <what>  blameless postmortem with owned action items
  /d3:capture --rule | --module | --architecture | --flow | --algorithm | --data-model | --domain
              | --threat | --runbook | --guide | --term   (or no flag: it routes, and asks if unsure)
  /d3:check [--drift] [--fix]    run the docs linter: vocabulary, links, Mermaid, ids, drift, coverage
  /d3:review [PR#|branch]        check a change against its plan, ADRs and rules; find undocumented work
  /d3:status                     what's in flight, what's overdue, what's undocumented

The loop:  init → prime → build → capture → check → review   (spec when a product question needs it)
The repo's own docs/README.md always wins over D³ defaults.
```
