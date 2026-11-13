<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner-dark.png">
  <img alt="Document-Driven Development (D³): shared docs for people and AI agents, checked against the code" src="assets/banner-light.png">
</picture>

[![CI](https://github.com/abuammarsami/d3/actions/workflows/ci.yml/badge.svg)](https://github.com/abuammarsami/d3/actions/workflows/ci.yml)
[![version](https://img.shields.io/badge/version-2.1.0-3f7f3b)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-5e5d59)](https://docs.claude.com/en/docs/claude-code)
[![docs-check](https://img.shields.io/badge/docs--check-zero%20deps-brightgreen)](tools/docs-check/README.md)

**D³ (Document-Driven Development) is a Claude Code plugin that writes down what your code can't say
(why a rule exists, what the team decided, which bug was already fixed once) as short pages in the
repo, hands the right pages to your AI assistant before it changes anything, and checks in CI that
the pages still match the code.**

Every codebase has a line nobody dares to touch. Nobody remembers why it's there. Then an AI
assistant "cleans it up", the tests pass, and it ships. The reason was never in the code, so there
was nothing for the assistant, or a new teammate, to read.

[![Watch the one-minute film: The line nobody touches](assets/film-poster.png)](https://github.com/abuammarsami/d3/releases/download/v2.1.0/d3-line.mp4)

▶ [Watch the one-minute film](https://github.com/abuammarsami/d3/releases/download/v2.1.0/d3-line.mp4)

Two more short films on the same idea:
[One angle](https://github.com/abuammarsami/d3/releases/download/v2.1.0/d3-why.mp4) (47 seconds) and
[Load-bearing](https://github.com/abuammarsami/d3/releases/download/v2.1.0/d3-tower.mp4) (52 seconds).

## Install

You need [Claude Code](https://docs.claude.com/en/docs/claude-code). The docs check also needs Node 18
or newer, and nothing else.

```text
/plugin marketplace add abuammarsami/d3
/plugin install d3@ammar-skills
```

### The first three things to type

```text
/d3:init                          set up docs/ in this repo (it lists every file and waits for your yes)
/d3:prime "the task you're on"    load the few pages that govern the task
/d3:capture --decision "…"        write down something you just decided
```

`init` never overwrites a file, and on a repo that already has docs it only reports what is missing.

## See it work

![A real run of the docs check: a business rule cites src/quota.js#canPost; after the function is renamed, the check reports the drift with the file and line](assets/demo.gif)

This is a real run. A business rule names the function that enforces it. Someone renames the
function, and the docs check points at the page that is now out of date, with the file and line.

## How it works

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/loop-dark.png">
  <img alt="The D³ loop. Set up once with /d3:init. Then, for every task: 1 before a task, /d3:prime finds the few pages that apply and gives them to your AI assistant; 2 build, you and your assistant work as usual; 3 write it down, /d3:capture puts a new decision, rule or fixed bug on its page; 4 check the work, /d3:review compares the change with what the team agreed; 5 keep the docs true, /d3:check in CI flags any page that no longer matches the code." src="assets/loop-light.png">
</picture>

1. **Before a task**, `/d3:prime` finds the three to six pages that govern it (the plan, past
   decisions, business rules, how the module works) and gives the assistant one line about each.
2. **Build** as you normally would.
3. **Write it down.** When you learn something, `/d3:capture` files it on the right page and asks
   before it writes.
4. **Check the work.** `/d3:review` compares the branch with the plan's acceptance criteria and the
   decisions and rules it might break, and lists behaviour that changed with no page updated.
5. **Keep the docs true.** On every pull request, the docs check runs with no AI and fails or warns
   when a page is broken or points at code that changed.

The habits come from how large engineering teams already work: design docs with acceptance criteria,
written decision records (ADRs), blameless incident reviews and docs checked in CI. D³ sets them up
in one command, so a solo developer or a small team can use them without a documentation department.

## What's inside

Seven skills and one linter. Each skill runs when you type its command; Claude also picks it up when
you ask for the same thing in plain words ("load the context for this task", "write that down as a
decision").

| Skill | When you use it | What it does |
|---|---|---|
| [`/d3:init`](skills/init/SKILL.md) `[--backfill]` | Once per repo | Sets up `docs/` with one place for each kind of knowledge, page templates, a guide to the document types, a short `AGENTS.md` that `CLAUDE.md` imports, a PR template, the docs check and its CI. Dry run first. `--backfill` drafts module references and *proposed* ADRs from existing code. |
| [`/d3:prime`](skills/prime/SKILL.md) `<task>` | Before a task | Loads the plan, ADRs, rules, module reference and flow that govern the task as a compact context pack, one line per doc. `--diff [base]` picks the docs that cite the files a branch changed. |
| [`/d3:capture`](skills/capture/SKILL.md) `--<kind> <what>` | When you learn something | Files new knowledge on its page with the right template, updates the indexes and runs the docs check. Lists the files and asks before writing. |
| [`/d3:spec`](skills/spec/SKILL.md) `<feature>` | When a feature needs a product review | Optional product spec (PRD): problem, users, non-goals, prioritised stories with Given/When/Then, and open questions marked `[NEEDS CLARIFICATION]` instead of guessed. |
| [`/d3:review`](skills/review/SKILL.md) `[PR#\|branch]` | Before you merge | Read-only. Which acceptance criteria the change satisfies, which ADR or rule it contradicts, what behaviour changed with no doc updated, which citations it broke. |
| [`/d3:check`](skills/check/SKILL.md) `[--drift] [--fix]` | Any time, and in CI | Runs the docs check and turns its findings into fixes. |
| [`/d3:status`](skills/status/SKILL.md) | When you want the overview | What is in flight, overdue for review, undocumented, or not yet graduated. |

[`/d3:d3`](skills/d3/SKILL.md) prints the help, and `/d3:d3 <verb>` routes to the commands above.
The linter lives in [`tools/docs-check`](tools/docs-check/README.md) and runs without Claude.

## Who it's for

- **Developers at any level.** Juniors get the context seniors carry in their heads. Seniors stop
  answering the same "why is it like this?" question.
- **Solo builders and people who build by prompting.** Your assistant stops undoing decisions it never
  knew about.
- **Product, QA and business colleagues.** The pages are plain English on GitHub, so you can read
  the rules and decisions without reading code.

## Works with any AI assistant

| Part | Where it runs |
|---|---|
| The commands (`/d3:init`, `prime`, `capture`, `review`, `check`, `spec`, `status`) | Claude Code, as a plugin |
| The pages D³ writes (`docs/` and `AGENTS.md`) | Anywhere: Codex, Cursor, GitHub Copilot, Gemini and any person on GitHub read them with nothing installed |
| The docs check | Any CI, or as a GitHub Action. No AI, no npm install |

---

## Reference

### Example: a review catching a real mistake

```text
> /d3:review main

Review of branch feat/unlimited against docs (base: main)
Plan: docs/plans/ads/posting-limits/README.md
Acceptance:   AC-2 ✗ "Given a Gold user, when they post, then the Gold quota applies" — a paid Gold user now skips it
Decisions:    ✗ membership.md:15 — `if (user.paid) return true` (src/ads/QuotaService.js:3) contradicts
                **Payment ≠ activation: the tier is granted by admin approval, not by paying.**
Undocumented: paid users unlimited — no doc in the diff changed; the method rename guard → check
              breaks the citation in membership.md (docs-check drift)
Verdict: needs changes
Follow-ups:   intended? /d3:capture --decision "Paid users post without a monthly limit", then update the rule
```

*From a smoke test of this release, trimmed.*

### Where each kind of knowledge goes

New to ADRs, PRDs and runbooks? They are the document types most engineering teams settle on, and each
answers one question: an **ADR** records why a decision was made, a **PRD** says what to build and for
whom, a **runbook** says how to do an operation safely. [Which document to write](docs/guides/document-types.md)
explains all of them in plain language.

| Kind of knowledge | Page | Capture with |
|---|---|---|
| Future work, with numbered acceptance criteria | `docs/plans/{module}/{kebab}/README.md` | `--plan` |
| Product spec (optional PRD) | `docs/specs/NNN-{kebab}/spec.md` | `/d3:spec` |
| A decision that is hard to reverse | `docs/architecture/decisions/adr-NNNN-{kebab}.md` (MADR) | `--decision` |
| How the system fits together, how a request moves | `docs/architecture/views/`, `docs/architecture/flows/` | `--architecture`, `--flow` |
| How a module works today | `docs/reference/modules/{module}.md` | `--module` |
| A domain, pricing or entitlement rule | `docs/reference/business-rules/{domain}.md` | `--rule` |
| A rule where one wrong edit costs money | `docs/reference/algorithms/` | `--algorithm` |
| Domain model, data model, threat model | `docs/reference/{domain,generated/data-model,security/threat-models}/` | `--domain`, `--data-model`, `--threat` |
| A shipped bug, dated and never edited later | `docs/reference/audits/YYYY-MM-DD-{kebab}.md` | `--bug` |
| A production incident, blameless, with owned action items | `docs/reference/incidents/` | `--incident` |
| Procedures, how-tos, onboarding | `docs/runbooks/`, `docs/guides/`, `docs/guides/tutorials/` | `--runbook`, `--guide`, `--tutorial` |
| A word the code uses | `docs/reference/glossary.md` | `--term` |

Your repo's own `docs/README.md` always wins over these defaults.

**Plans graduate.** When a plan ships, what outlives it moves to its permanent page (the module
reference, the rule, the flow), which links back. Nobody should have to read a stack of old plans, or
the code, to learn how the system works today.

### The docs check

A Node script with no dependencies (`tools/docs-check/check.mjs`, Node 18+). `/d3:init` copies it
into your repo and wires it into CI. It needs no AI and no npm install.

- **Errors** fail CI: frontmatter outside the vocabulary, broken links and anchors, Mermaid that does
  not parse, a reused ADR or spec number, an open `[NEEDS CLARIFICATION]` in a settled doc.
- **Warnings** are configurable: live plans without numbered acceptance criteria, code citations that
  drifted (`path#Symbol` or `path:line` whose file, lines or symbol are gone or, with a lock file,
  whose code changed), screenshots under `docs/`, incident action items without an owner,
  undocumented modules, and plans that shipped without graduating.
- **Helpers:** `review-due`, `cites <path>` (which docs describe this code?), `drift --changed <base>`,
  `lock`, `--json`.

Use it as a GitHub Action without copying it in:

```yaml
- uses: actions/checkout@v4
- uses: abuammarsami/d3@v2
  with:
    args: --strict   # optional
```

Full reference: [tools/docs-check/README.md](tools/docs-check/README.md).

### How it compares

The longer write-up:
[Document-Driven Development (D³): Docs Are the Interface Your AI Works Through](https://ammar-portfolio-zeta.vercel.app/deep-dives/document-driven-development).

| | Spec-driven tools (Spec Kit, Kiro, BMAD) | Memory banks, generated wikis | D³ |
|---|---|---|---|
| Scope | One feature, planned ahead | The whole repo | The whole repo, for its lifetime |
| Knows why (decisions, rules, past bugs) | Inside that feature's spec | No, it is generated from code | Yes: ADRs, rules, audits, incidents |
| Stays true after the feature ships | No | Regenerated | `capture`, graduation and the drift check |
| Checked in CI without AI | No | No | Yes |
| Works with any agent | Mostly | Per tool | Yes, through `AGENTS.md` and Markdown |

They combine well. A spec-driven tool can drive one feature while D³ keeps the repo's knowledge
current, and behaviour guidelines such as the Karpathy-inspired `CLAUDE.md` shape how the agent works
while D³ supplies what is true about the system.

**Left out on purpose:** generating code from specs, a cast of role personas, heavy ceremony for small
changes (a one-PR plan is five short sections), and LLM-written project overviews in `AGENTS.md`. A
2026 study found those make agents worse, while human-written conventions and commands help.

### FAQ

**Does it change my repo without asking?** No. Commands that write list every file and wait for a yes.
`init` is a dry run until you confirm, never overwrites a file, and on a repo that already has a docs
system it only reports what is missing.

**Our reasons are already in Jira, Slack or someone's head. Why another place?** Because none of
those is next to the code. A closed ticket or an old thread only helps a person who already knows
it exists, and an AI assistant working in the repo never opens it. D³ copies the part that lasts
(the decision, the rule, the bug that was fixed) onto a short page beside the code it explains.

**Do we have to stop using Jira or Confluence?** No. Tickets track the work. D³ keeps the lasting
reasons (decisions, rules, past bugs) next to the code they explain, and a page can link to the
ticket it came from.

**My team already has docs with a different layout.** Put a `<!-- docs-check:vocabulary -->` block in
your `docs/README.md`, or keep the one you have. D³ and the docs check follow it.

**Do we need a PRD for everything?** No. A plan with numbered acceptance criteria is the default.
`/d3:spec` is for product questions that need their own review.

**Does `prime` dump all my docs into the context?** No. It loads three to six docs, one line each.

**Does it need graphify, a session log or Cursor rules?** No. They are used only when they already
exist ([shared/integrations.md](shared/integrations.md)).

### Updating and uninstalling

```text
/plugin marketplace update ammar-skills     refresh the marketplace
/plugin update d3@ammar-skills              get the latest version
/plugin uninstall d3@ammar-skills           remove the plugin
```

Uninstalling removes the commands only. The pages in `docs/`, `AGENTS.md` and the copy of the docs
check in `tools/docs-check/` belong to your repo and stay where they are.

### When something goes wrong

- **The `/d3:` commands don't appear.** Run `/plugin`, check that `d3` is installed and enabled, then
  restart Claude Code.
- **The docs check reports drift after a change you meant to make.** Update the page it names, then
  run `node tools/docs-check/check.mjs lock` to record the new code as the reference.
- **Mermaid diagrams are only checked by their first line.** That is the default with no
  dependencies. For a full parse, install `mermaid` and `jsdom` next to the check
  ([details](tools/docs-check/README.md)).
- **The check fails to start.** It needs Node 18 or newer.
- Anything else: [open an issue](https://github.com/abuammarsami/d3/issues) with the command and its
  output.

### Testing

- `node --test tools/docs-check/test/*.test.mjs tools/init/test/*.test.mjs` runs the docs check and
  scaffold tests, each rule proven both ways.
- `evals/` has behaviour cases for every command (help, init safety, prime, prime --diff, capture
  routing, ADR numbering and supersede, incidents, spec, review, check, answering from docs). Run them
  with `claude plugin eval . --ablation with-without` to see the score with and without the plugin.

### Contributing

Issues and pull requests are welcome. This repo uses D³ on itself: a change comes with the doc that
describes it, and CI runs the docs check.

## License

[MIT](LICENSE) © Md. Abu Ammar
