---
title: "Guide: which document to write (ADR, PRD, runbook and the rest)"
type: guide
status: active
owner: Md. Abu Ammar
created: 2026-11-11
last-reviewed: 2026-11-11
tags: [guide, onboarding, adr, prd, taxonomy]
related:
  - ../README.md
  - ../../templates/docs/README.md
supersedes: null
superseded-by: null
---

# Which document to write

*For anyone who has heard "write an ADR" or "where is the PRD?" and was not sure what was being asked.
No background is assumed.*

## When you need this

You know something worth keeping (a decision, a rule, a bug you fixed, a way to deploy) and you are
not sure what kind of document it is. Or you joined a team that uses these names and nobody explained
them.

## The short version

Software teams ended up with a small set of document types because each one answers a different
question. Pick the question, and you have picked the document.

| The question | The document | In one line |
|---|---|---|
| What are we building, for whom, and why? | **PRD** (product requirements document), also called a spec | The problem, the users, and what "done" means, before anyone designs a solution |
| How will we build it, and how do we know it works? | **Plan** | Tasks plus numbered acceptance criteria that a test or a reviewer can check |
| Why did we choose this, and not the other option? | **ADR** (architecture decision record) | One decision, its context, the options considered, and what it costs us |
| How does the system fit together? | **Architecture view** | A diagram and a page: the parts, and who talks to whom |
| What happens, step by step, when a request comes in? | **Flow** | One sequence diagram, end to end |
| How does this module work today? | **Module reference** | The current state, kept true as the code changes |
| What is the rule? | **Business rule** | A rule of the business, stated once, with the code that enforces it cited |
| How do I do this operation safely? | **Runbook** | Numbered steps for deploy, rotate, restore, written for someone under pressure |
| How do I do this development task? | **Guide** | One task, for someone who knows the basics |
| What went wrong in production, and what did we change? | **Incident review** (postmortem) | A blameless timeline, the causes, and action items with owners |
| What bug did we ship, and how did we find it? | **Audit** | Dated, never edited afterwards, so the lesson survives |
| How could this be attacked? | **Threat model** | Each way in, what it could cost, and what stops it |
| What does this word mean here? | **Glossary** | The team's own words, one meaning each |

## The four people ask about most

### ADR: architecture decision record

A short page that records one decision that would be expensive to reverse: which database, which
queue, why money is stored as integers. It has four parts: the context, the options, the decision, and
the consequences, including the bad ones.

The rule that makes ADRs useful is that an accepted ADR is **never rewritten**. If the team changes its
mind, it writes a new ADR that supersedes the old one. That way the history of why is still there.

The idea was popularised by Michael Nygard's 2011 article "Documenting Architecture Decisions". D³ uses
the [MADR](https://adr.github.io/madr/) format. Template: [adr.md](../../templates/docs/adr.md).

Write one when a new teammate would reasonably ask "why on earth is it done this way?"

### PRD: product requirements document

A PRD describes the problem before the solution: who has it, what they need, what is out of scope, and
how success is measured. It deliberately says little about how to build it.

Not every change needs one. In D³ a PRD is optional and lives in `docs/specs/`; a plan with numbered
acceptance criteria is the default. Write a PRD when the "what and why" needs its own review, for
example when product, design and engineering have to agree first. Template:
[spec.md](../../templates/docs/spec.md).

### Runbook

Steps for an operation, written so that someone who has never done it can do it correctly at a bad
moment. A good runbook says how to check each step worked and how to undo it. Template:
[runbook.md](../../templates/docs/runbook.md).

### Incident review (postmortem)

Written after something broke in production. "Blameless" means it describes what the system allowed to
happen, not who made the mistake, because people who fear blame stop reporting problems. It ends with
action items that have an owner. The practice is described in Google's *Site Reliability Engineering*
book. Template: [incident.md](../../templates/docs/incident.md).

## Two things that are easy to mix up

- **A plan is temporary; reference is permanent.** A plan describes work to be done. When it ships,
  what is still true moves to a reference page, and the plan stays behind as a record.
- **An ADR is why; reference is what.** "We use optimistic locking" is reference. "We chose optimistic
  locking over row locks because writes rarely collide" is an ADR.

## Where the folder layout comes from

D³ did not invent these. It puts well-known practices in one layout:

- [Diátaxis](https://diataxis.fr/) sorts documentation into tutorials, how-to guides, reference and
  explanation.
- [arc42](https://arc42.org/) and the [C4 model](https://c4model.com/) describe architecture views.
- [MADR](https://adr.github.io/madr/) is the ADR format.
- STRIDE, from Microsoft, is the checklist used in threat models.

## Steps

1. Find your question in the table above.
2. Run `/d3:capture` and describe what you learned in a sentence. It proposes the document type and
   the file, and writes only after you say yes.
3. Or copy the matching file from [`templates/docs/`](../../templates/docs/README.md) yourself.

## How you know it worked

`node tools/docs-check/check.mjs` reports 0 errors, and the page is listed in its folder's `README.md`.

The full map of types and folders is in [docs/README.md](../README.md).
