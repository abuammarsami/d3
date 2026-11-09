#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname docs/README.md)"
cat > docs/README.md <<'D3_EOF_0'
# Docs

Docs by type: architecture/ (decisions, views, flows), plans/, specs/, runbooks/, guides/, reference/ (modules, business-rules, audits, incidents), legacy/.
D3_EOF_0
mkdir -p "$(dirname docs/architecture/decisions/adr-0003-checkout-idempotency.md)"
cat > docs/architecture/decisions/adr-0003-checkout-idempotency.md <<'D3_EOF_1'
---
title: "ADR-0003: Checkout idempotency by key"
type: adr
status: accepted
owner: Owner
created: 2026-10-01
last-reviewed: 2026-10-01
---
# ADR-0003: Checkout idempotency by key

## Decision
Dedupe checkout by a client-supplied Idempotency-Key header stored for 24 hours.
D3_EOF_1
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
