---
name: spec
description: "Writes an optional product spec (the big-tech PRD) for a feature whose what-and-why needs its own review: problem, users, goals and non-goals, prioritized user stories with Given/When/Then, FR-### requirements (EARS), SC-### success criteria, and open questions marked [NEEDS CLARIFICATION] instead of guessed. Then hands off to a plan that builds it. Use when the user runs /d3:spec or asks for a spec or PRD; for ordinary features a plan with acceptance criteria (/d3:capture --plan) is enough."
argument-hint: "<feature or problem statement>"
---

# /d3:spec

A spec answers **what and why, for users**; a plan answers **how**. Most work needs only a plan — its
Goals and Acceptance criteria are the spec. Write a separate spec when the product question deserves
its own review: several stakeholders, a pricing or policy decision, a contract other teams build on.

Shared rules, relative to this skill's directory: [safety](../../shared/safety.md) ·
[taxonomy](../../shared/taxonomy.md) · [follow-through](../../shared/follow-through.md) ·
[frontmatter](../../shared/frontmatter.md).

## Steps

1. **Taxonomy** — Step 0 in `../../shared/taxonomy.md`.
2. **Is a spec warranted?** If the request is one screen, one endpoint or one bug, say so and offer
   `/d3:capture --plan` instead. Continue only if the user wants the spec.
3. **Ask, briefly.** The few answers that change the spec, most important first: who has the
   problem, how we will know it worked, what is out of scope, any hard constraint. Don't interrogate;
   whatever stays unknown becomes `[NEEDS CLARIFICATION: <question> — <who answers>]`.
4. **Prior art** — search `docs/` for related plans, specs, ADRs, rules and incidents; link them.
5. **Draft** from `docs/templates/spec.md` (else `../../templates/docs/spec.md`) at
   `docs/specs/NNN-{kebab}/spec.md`, where `NNN` is `max + 1` over `docs/specs/` (collision-checked).
   - User stories in priority order; **P1 alone must be a useful release**.
   - Every requirement testable, numbered `FR-001…`; EARS where it helps ("When …, the system shall …").
   - Success criteria `SC-001…` are measurable and technology-free.
   - **Never invent** a metric, a price, a rule or a user need.
6. **Confirm** the path and the follow-through files, then write (`status: draft`).
7. **Hand off** — the plan that builds it (`/d3:capture --plan`) sets `spec:` to this file, uses the
   `FR-` / `SC-` ids in its Tasks and Test plan, and the spec's `related:` points back at the plan.
8. **Follow through** — `../../shared/follow-through.md`, including the docs check.

## Rules

- A spec with an open `[NEEDS CLARIFICATION]` stays `draft` or `in-review`; the docs check refuses one
  in an `active` spec.
- No implementation detail in the spec — frameworks, tables and endpoints belong in the plan.
- One spec per product question; if it grows past one release, split by user story.
