// The init scaffold's promises: a dry run writes nothing, --apply never overwrites, an existing
// CLAUDE.md gains only the @AGENTS.md import, and a repo that already has a docs system is only reported on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const scaffold = path.join(here, '../scaffold.mjs');
const checker = path.join(here, '../../docs-check/check.mjs');
const run = (root, ...extra) => execFileSync('node', [scaffold, '--root', root, '--owner', 'Tester', '--today', '2026-11-09', ...extra], { encoding: 'utf8' });

function repo(files = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'd3-init-'));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    writeFileSync(path.join(root, name), content);
  }
  return root;
}

test('dry run writes nothing', () => {
  const root = repo({ 'src/a.js': '1\n' });
  const out = run(root);
  assert.match(out, /Dry run/);
  assert.ok(!existsSync(path.join(root, 'docs')));
  assert.ok(!existsSync(path.join(root, 'AGENTS.md')));
});

test('apply builds a docs system that passes its own check, and keeps existing files', () => {
  const root = repo({ 'AGENTS.md': '# Mine\n', 'CLAUDE.md': '# Contract\n', 'src/a.js': '1\n' });
  const out = run(root, '--apply');
  assert.match(out, /skip\s+AGENTS\.md/);
  assert.match(out, /append CLAUDE\.md/);
  assert.equal(readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), '# Mine\n');
  assert.equal(readFileSync(path.join(root, 'CLAUDE.md'), 'utf8'), '# Contract\n\n\n@AGENTS.md\n');
  assert.ok(existsSync(path.join(root, 'docs/architecture/decisions/README.md')));
  assert.ok(existsSync(path.join(root, 'tools/docs-check/src/yaml.mjs')));
  const guide = readFileSync(path.join(root, 'docs/guides/document-types.md'), 'utf8');
  assert.match(guide, /\]\(\.\.\/templates\/adr\.md\)/);
  assert.doesNotMatch(guide, /templates\/docs\//);
  assert.match(readFileSync(path.join(root, 'docs/guides/README.md'), 'utf8'), /\(document-types\.md\)/);
  const check = execFileSync('node', [checker, '--root', root, '--today', '2026-11-09'], { encoding: 'utf8' });
  assert.match(check, /0 error\(s\), 0 warning\(s\)/);
});

test('a repo with a docs system already is reported on, never written to', () => {
  const root = repo({ 'docs/README.md': '# Docs\n<!-- docs-check:vocabulary -->\n```yaml\nrequired: []\n```\n' });
  const out = run(root, '--apply');
  assert.match(out, /init only reports on it/);
  assert.match(out, /missing: AGENTS\.md/);
  assert.ok(!existsSync(path.join(root, 'AGENTS.md')));
});

test('owner values YAML would misread are quoted, and a bad --today is refused', () => {
  const root = repo({ 'src/a.js': '1\n' });
  execFileSync('node', [scaffold, '--root', root, '--owner', '@octocat: Team #2', '--today', '2026-11-09', '--apply'], { encoding: 'utf8' });
  const check = execFileSync('node', [checker, '--root', root, '--today', '2026-11-09'], { encoding: 'utf8' });
  assert.match(check, /0 error\(s\)/);
  assert.match(readFileSync(path.join(root, 'docs/README.md'), 'utf8'), /^owner: "@octocat: Team #2"$/m);
  assert.throws(() => execFileSync('node', [scaffold, '--root', root, '--today', '2026/01/01'], { encoding: 'utf8', stdio: 'pipe' }), /not a real YYYY-MM-DD/);
});
