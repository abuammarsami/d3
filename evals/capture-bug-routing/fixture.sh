#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname CLAUDE.md)"
cat > CLAUDE.md <<'D3_EOF_0'
# Shopfront — Agent Contract
Router. Detail in `docs/`. Rule 14: no undocumented work.
D3_EOF_0
mkdir -p "$(dirname docs/README.md)"
cat > docs/README.md <<'D3_EOF_1'
# Docs
Six type folders: architecture/, plans/, runbooks/, guides/, reference/
(audits, incidents, modules, business-rules), legacy/.
D3_EOF_1
mkdir -p "$(dirname docs/reference/audits/README.md)"
cat > docs/reference/audits/README.md <<'D3_EOF_2'
# Audits
Dated, immutable code/parity fixes. Write a new dated file; never edit an old one.
| Date | Scope |
|------|-------|
D3_EOF_2
mkdir -p "$(dirname docs/architecture/decisions/adr-0003-checkout-idempotency.md)"
cat > docs/architecture/decisions/adr-0003-checkout-idempotency.md <<'D3_EOF_3'
---
type: adr
status: accepted
---
# ADR-0003: Checkout idempotency
**Status:** accepted
Decision: dedupe checkout by an idempotency key.
D3_EOF_3
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
