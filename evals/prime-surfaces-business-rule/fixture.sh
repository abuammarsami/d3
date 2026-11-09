#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname CLAUDE.md)"
cat > CLAUDE.md <<'D3_EOF_0'
# Shopfront — Agent Contract

Router. Long-form detail lives in `docs/`; module rules auto-load per subtree.

## Module Rules (auto-loaded)
- `src/ads/CLAUDE.md` — ad posting + validation
- `src/billing/CLAUDE.md` — membership + payments

## Reference
- Membership + quota rules: docs/reference/business-rules/membership.md
- Plans: docs/plans/

## Rules
14. No undocumented work — docs ship in the same change set as the code.
D3_EOF_0
mkdir -p "$(dirname docs/README.md)"
cat > docs/README.md <<'D3_EOF_1'
# Docs

Every doc lives in one of six top-level folders, organized by **document type**
(not by feature): `architecture/`, `plans/`, `runbooks/`, `guides/`, `reference/`
(audits, incidents, modules, business-rules), `legacy/`.
Status lifecycle: draft → in-review → active → implemented → deprecated.
D3_EOF_1
mkdir -p "$(dirname docs/reference/business-rules/membership.md)"
cat > docs/reference/business-rules/membership.md <<'D3_EOF_2'
---
type: reference
status: active
---
# Membership

Tiers Bronze → Platinum, each with a monthly post quota.

**Payment ≠ activation: the tier is granted by admin approval, not by paying.**

- `PerMonthTotalPost` — the monthly ad-post quota for the tier (`MembershipPolicy` table).
- Upgrades create a `MembershipRequest` (status Pending) until an admin approves.
D3_EOF_2
mkdir -p "$(dirname docs/plans/ads/posting-limits/README.md)"
cat > docs/plans/ads/posting-limits/README.md <<'D3_EOF_3'
---
type: plan
status: active
---
# Plan — enforce per-tier ad posting limits

Gate ad-create on `PerMonthTotalPost` for the caller's active tier. Count posts in
the current billing month; block with a clear error at the quota.
D3_EOF_3
mkdir -p "$(dirname docs/plans/README.md)"
cat > docs/plans/README.md <<'D3_EOF_4'
# Plans
| Plan | Status |
|------|--------|
| ads/posting-limits | active |
D3_EOF_4
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
