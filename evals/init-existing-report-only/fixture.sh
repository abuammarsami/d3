#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname docs/README.md)"
cat > docs/README.md <<'D3_EOF_0'
# Docs

<!-- docs-check:vocabulary -->
```yaml
required: [title, type, status]
types:
  plan: [draft, active, implemented]
review:
  default-days: 90
  exempt-types: []
  exempt-statuses: []
template-paths: []
```
D3_EOF_0
mkdir -p "$(dirname CLAUDE.md)"
cat > CLAUDE.md <<'D3_EOF_1'
# Contract
D3_EOF_1
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
