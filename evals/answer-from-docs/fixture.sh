#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname CLAUDE.md)"
cat > CLAUDE.md <<'D3_EOF_0'
# Shop — Agent Contract
Router. Detail in docs/.
D3_EOF_0
mkdir -p "$(dirname docs/README.md)"
cat > docs/README.md <<'D3_EOF_1'
# Docs

Docs by type: architecture/ (decisions, views, flows), plans/, specs/, runbooks/, guides/, reference/ (modules, business-rules, audits, incidents), legacy/.
D3_EOF_1
mkdir -p "$(dirname docs/reference/business-rules/refunds.md)"
cat > docs/reference/business-rules/refunds.md <<'D3_EOF_2'
---
title: Refunds
type: reference
status: active
owner: Owner
created: 2026-10-01
last-reviewed: 2026-10-01
---
# Refunds

**Refunds are allowed for 14 days after delivery, not after purchase** — card-network chargeback rules count from delivery, and support agreed this with the payment provider (ADR-0007).

Enforced in `src/refunds/policy.ts#isRefundable`.
D3_EOF_2
mkdir -p "$(dirname src/refunds/policy.ts)"
cat > src/refunds/policy.ts <<'D3_EOF_3'
export function isRefundable(o: { deliveredAt: Date }, now: Date) {
  return now.getTime() - o.deliveredAt.getTime() <= 14 * 864e5;
}
D3_EOF_3
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
