#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname CLAUDE.md)"
cat > CLAUDE.md <<'D3_EOF_0'
# Shop — Agent Contract
Docs in docs/. No undocumented work.
D3_EOF_0
mkdir -p "$(dirname docs/README.md)"
cat > docs/README.md <<'D3_EOF_1'
# Docs

Docs by type: architecture/ (decisions, views, flows), plans/, specs/, runbooks/, guides/, reference/ (modules, business-rules, audits, incidents), legacy/.
D3_EOF_1
mkdir -p "$(dirname docs/plans/README.md)"
cat > docs/plans/README.md <<'D3_EOF_2'
# Plans
| Plan | Status |
|---|---|
D3_EOF_2
mkdir -p "$(dirname src/orders/orders.service.ts)"
cat > src/orders/orders.service.ts <<'D3_EOF_3'
export class OrdersService {
  list(userId: string) { return []; }
}
D3_EOF_3
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
