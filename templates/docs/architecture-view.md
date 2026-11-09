---
title: "<View: arc42 section N or C4 level — subject>"
type: architecture
status: draft
owner: <name>
created: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
tags: [architecture, arc42, c4, <module>]
related:
  - <relative path to the ADRs that shaped this view>
supersedes: null
superseded-by: null
---

# <View title>

*One view answers one question at one zoom level. Pick the [C4](https://c4model.com/) level (context,
container or component; never code, the knowledge graph covers that) and the
[arc42](https://arc42.org/overview) section it belongs to (3 context, 5 building blocks, 6 runtime,
7 deployment, 8 cross-cutting concepts).*

## In plain language

*What this picture shows, in two or three sentences.*

## The view

*Example: a container view. Replace every element with what the code actually has.*

```mermaid
C4Container
  title Containers (example)
  Person(member, "Member", "Posts and buys on the marketplace")
  System_Boundary(platform, "The system") {
    Container(web, "Web app", "Framework", "Serves the site")
    Container(api, "API", "Framework", "JSON API for the mobile app")
    ContainerDb(sql, "Database", "Engine", "System of record")
  }
  System_Ext(gateway, "Payment gateway", "Third-party payments")
  Rel(member, web, "Uses", "HTTPS")
  Rel(web, sql, "Reads and writes", "SQL")
  Rel(api, sql, "Reads and writes", "SQL")
  Rel(web, gateway, "Takes payment", "HTTPS")
```

## Where each element comes from

*Every box and arrow above, with the code that proves it. A row with no citation is a row to delete.*

| Element | Kind | Code (`file:line`) | Notes |
|---|---|---|---|
| *Web app* | *container* | *`web/src/main.ts#bootstrap`* | |
| *web → Database* | *relationship* | *`src/.../orders-repository.ts#OrdersRepository`* | |

## Responsibilities and boundaries

| Element | Owns | Never does |
|---|---|---|
| | | |

## Decisions behind this view

- *ADR links, one line each on what they fixed in place.*

## Risks and known gaps

- *What this view shows that is not as it should be, each linked to a plan or an audit.*

## Verified

*Date, commit, and how the view was checked against the code (for example the code search or graph query used).*
