#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname docs/README.md)"
cat > docs/README.md <<'D3_EOF_0'
# Docs

Docs by type: architecture/ (decisions, views, flows), plans/, specs/, runbooks/, guides/, reference/ (modules, business-rules, audits, incidents), legacy/.
D3_EOF_0
mkdir -p "$(dirname docs/reference/business-rules/membership.md)"
cat > docs/reference/business-rules/membership.md <<'D3_EOF_1'
---
title: Membership
type: reference
status: active
owner: Owner
created: 2026-10-01
last-reviewed: 2026-10-01
---
# Membership

**Payment ≠ activation: the tier is granted by admin approval, not by paying.**

The quota check is `src/ads/quota.ts#canPost`.
D3_EOF_1
mkdir -p "$(dirname src/ads/quota.ts)"
cat > src/ads/quota.ts <<'D3_EOF_2'
export function canPost(user: { paid: boolean; tierQuota: number }, posts: number) {
  if (user.paid) return true;
  return posts < user.tierQuota;
}
D3_EOF_2
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
