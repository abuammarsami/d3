#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname docs/README.md)"
cat > docs/README.md <<'D3_EOF_0'
# Docs

Docs by type: architecture/ (decisions, views, flows), plans/, specs/, runbooks/, guides/, reference/ (modules, business-rules, audits, incidents), legacy/.
D3_EOF_0
mkdir -p "$(dirname docs/architecture/decisions/adr-0001-modular-monolith.md)"
cat > docs/architecture/decisions/adr-0001-modular-monolith.md <<'D3_EOF_1'
---
title: "ADR-0001: Modular monolith"
type: adr
status: accepted
owner: Owner
created: 2026-10-01
last-reviewed: 2026-10-01
---
# ADR-0001
D3_EOF_1
mkdir -p "$(dirname docs/architecture/decisions/adr-0002-postgres.md)"
cat > docs/architecture/decisions/adr-0002-postgres.md <<'D3_EOF_2'
---
title: "ADR-0002: Postgres"
type: adr
status: accepted
owner: Owner
created: 2026-10-01
last-reviewed: 2026-10-01
---
# ADR-0002
D3_EOF_2
mkdir -p "$(dirname docs/architecture/decisions/adr-0005-outbox.md)"
cat > docs/architecture/decisions/adr-0005-outbox.md <<'D3_EOF_3'
---
title: "ADR-0005: Outbox for events"
type: adr
status: accepted
owner: Owner
created: 2026-10-01
last-reviewed: 2026-10-01
---
# ADR-0005
D3_EOF_3
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
