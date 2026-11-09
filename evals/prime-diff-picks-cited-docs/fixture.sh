#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname docs/README.md)"
cat > docs/README.md <<'D3_EOF_0'
# Docs

Docs by type: architecture/ (decisions, views, flows), plans/, specs/, runbooks/, guides/, reference/ (modules, business-rules, audits, incidents), legacy/.
D3_EOF_0
mkdir -p "$(dirname src/billing/invoice.ts)"
cat > src/billing/invoice.ts <<'D3_EOF_1'
export function totalWithTax(subtotal: number) {
  return Math.round(subtotal * 1.15);
}
D3_EOF_1
mkdir -p "$(dirname src/ads/quota.ts)"
cat > src/ads/quota.ts <<'D3_EOF_2'
export const FREE_LIMIT = 3;
D3_EOF_2
mkdir -p "$(dirname docs/reference/business-rules/billing.md)"
cat > docs/reference/business-rules/billing.md <<'D3_EOF_3'
---
title: Billing
type: reference
status: active
owner: Owner
created: 2026-10-01
last-reviewed: 2026-10-01
---
# Billing

**VAT is 15%, rounded to the nearest unit** — `src/billing/invoice.ts#totalWithTax`.
D3_EOF_3
mkdir -p "$(dirname docs/reference/business-rules/ads.md)"
cat > docs/reference/business-rules/ads.md <<'D3_EOF_4'
---
title: Ads
type: reference
status: active
owner: Owner
created: 2026-10-01
last-reviewed: 2026-10-01
---
# Ads

Free users may post 3 ads — `src/ads/quota.ts#FREE_LIMIT`.
D3_EOF_4
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
