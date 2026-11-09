---
title: "Glossary entry template"
type: glossary
status: active
owner: <name>
created: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
tags: [glossary, template]
supersedes: null
superseded-by: null
---

# Glossary entry template

*Glossary entries are not separate files. Each is one `###` section in `reference/glossary.md`, in
alphabetical order. Copy the block below into its place.*

```markdown
### <Term>

**<Term>** (*also:* <synonyms, Bangla term if users see one>). <One-sentence definition a new engineer
understands without context.>

- **In code:** `<TypeOrEnum>` in `<file:line>`; table `<schema.table>`.
- **Not to be confused with:** <the nearby term, and the difference>.
- **See:** <link to the business rule, flow or ADR that governs it>.
```

**Rules.** Define the term as the code uses it; where the code and the business disagree, say so. Cite
where it lives. Link the rule rather than restating it. One term per heading, so its anchor
(`#<term>`) is stable and linkable.
