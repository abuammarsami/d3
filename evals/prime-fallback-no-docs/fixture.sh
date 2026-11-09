#!/usr/bin/env bash
# Builds the case workspace: a tiny repo with a docs/ corpus.
set -euo pipefail
mkdir -p "$(dirname CLAUDE.md)"
cat > CLAUDE.md <<'D3_EOF_0'
# Widgets API — Agent Contract
A small .NET service. No docs/ folder yet.
D3_EOF_0
mkdir -p "$(dirname src/Program.cs)"
cat > src/Program.cs <<'D3_EOF_1'
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.MapGet("/health", () => "ok");
app.Run();
D3_EOF_1
git init -q . && git add -A && git -c user.name=eval -c user.email=eval@example.com commit -qm fixture || true
