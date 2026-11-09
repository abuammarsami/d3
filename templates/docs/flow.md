---
title: "<Flow: what the user does, end to end>"
type: flow
status: draft
owner: <name>
created: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
tags: [flow, runtime, <module>]
related:
  - <relative path to the architecture view and business rules this flow implements>
supersedes: null
superseded-by: null
---

# <Flow title>

## In plain language

*The flow as the user experiences it, in three to five sentences.*

## Trigger and outcome

| | |
|---|---|
| **Trigger** | *The request, job or callback that starts it* |
| **Happy outcome** | *What is true afterwards: rows written, events raised, what the user sees* |
| **Entry points** | *Web route, API route, worker job* |

## Sequence

*Example. Replace each participant and message with the real class, handler, procedure or table.*

```mermaid
sequenceDiagram
  autonumber
  actor U as Member
  participant C as Controller
  participant H as Handler
  participant R as Repository
  participant DB as SQL Server
  U->>C: POST /api/v1/resource
  C->>H: Send(Command)
  H->>H: Validate (FluentValidation)
  alt invalid
    H-->>C: 422 VALIDATION_ERROR (check the controller mapping)
    C-->>U: ApiResponse with errors
  else valid
    H->>R: ResourceCreateAsync(...)
    R->>DB: INSERT resource
    DB-->>R: new id
    R-->>H: id
    H-->>C: Result
    C-->>U: 201 ApiResponse
  end
```

## Where each step comes from

| # | Step | Code (`file:line`) |
|---|---|---|
| 1 | *POST /api/v1/resource* | *`src/api/resources.controller.ts#create`* |
| 2 | *Send(Command)* | |

## Refusals

*Every way the flow can stop, with the error code and the HTTP status (CLAUDE.md §11: 400 = did not
parse, 422 = parsed and refused).*

| Condition | Code | Status | Raised at |
|---|---|---|---|
| | | | |

## Side effects

*Cache tags invalidated, notifications queued, audit rows, money moved.*

## Tests that pin this flow

- *`FullyQualifiedName~...` — what it proves.*

## Verified

*Date, commit, and who traced the diagram against the code.*
