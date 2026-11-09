#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname docs/README.md)"
cat > docs/README.md <<'D3_EOF_0'
---
title: Docs
type: reference
status: active
owner: Owner
created: 2026-10-01
last-reviewed: 2026-10-01
---

# Docs
D3_EOF_0
mkdir -p "$(dirname docs/guides/setup.md)"
cat > docs/guides/setup.md <<'D3_EOF_1'
---
title: Setup
type: guide
status: done
owner: Owner
created: 2026-10-01
last-reviewed: 2026-10-01
---
# Setup

See [the runbook](../runbooks/deploy.md).
D3_EOF_1
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
