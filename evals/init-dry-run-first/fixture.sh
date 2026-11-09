#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname CLAUDE.md)"
cat > CLAUDE.md <<'D3_EOF_0'
# Widgets — Agent Contract
Build with `npm run build`.
D3_EOF_0
mkdir -p "$(dirname package.json)"
cat > package.json <<'D3_EOF_1'
{ "name": "widgets", "scripts": { "build": "tsc", "test": "vitest run" } }
D3_EOF_1
mkdir -p "$(dirname src/index.ts)"
cat > src/index.ts <<'D3_EOF_2'
export const ok = true;
D3_EOF_2
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
