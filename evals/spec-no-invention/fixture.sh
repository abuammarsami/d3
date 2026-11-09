#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname docs/README.md)"
cat > docs/README.md <<'D3_EOF_0'
# Docs

Docs by type: architecture/ (decisions, views, flows), plans/, specs/, runbooks/, guides/, reference/ (modules, business-rules, audits, incidents), legacy/.
D3_EOF_0
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
