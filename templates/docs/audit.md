---
title: "<Audit: the symptom, in the reporter's words>"
type: audit
status: active
owner: <name>
created: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
tags: [audit, <area>]
related:
  - <relative path to the plan, the business rule or the PR notes>
supersedes: null
superseded-by: null
---

# <Audit title>

> **Dated and immutable.** This records what was found and fixed on the date in the file name. Do not
> edit it afterwards except to add a pointer; to re-audit, write a **new dated file** and link it from
> `related:`. Set `status: resolved` once every finding is closed.

## In plain language

*Two or three sentences a non-engineer can follow: what went wrong for a user, why, and that it is fixed.*

## Symptom

*Quote the report **verbatim**: the owner's message, the user's words, the error text or the log line.
Add where and when it was seen (environment, build, date).*

> <verbatim report>

## Root cause

*Name the line that is wrong, as `path/to/file.ext:123` or `path/to/file.ext#Symbol`, then say why. Answer two questions: why does it
happen only here, and why only in this environment.*

| Where | What it does | Why it is wrong |
|---|---|---|
| `<path>:<line>` | *<what the code does>* | *<the broken assumption>* |

## Fix

- *What changed and why this is the right place for the change.*

**Files changed**

| File | Change |
|---|---|
| `<path>` | *<one line>* |

**Not touched, and why**

- `<path or behaviour>`: *<the reason it was left alone>*

*If data was corrupted, name the backfill script and how it was run.*

## Verification

1. *The exact step, command or test, and the result expected.*
2. *The test that fails when the fix is reverted.*
3. *The check on the real environment, if one was made.*
