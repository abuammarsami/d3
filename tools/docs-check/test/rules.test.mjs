// The D³ rules and the YAML reader, each proven both ways (a good input passes, a bad one is reported).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Repo } from '../src/repo.mjs';
import { parseMarkdown } from '../src/markdown.mjs';
import { parseYaml } from '../src/yaml.mjs';
import { runChecks } from '../src/run.mjs';
import { DEFAULT_VOCABULARY_YAML } from '../src/vocabulary.mjs';
import { checkDrift, citationsOf, citationKey, fingerprint } from '../src/rules.mjs';

const TODAY = '2026-11-09';

function fixture(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'd3-check-'));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    writeFileSync(path.join(root, name), content);
  }
  return new Repo(root, Object.keys(files));
}

const fm = (fields, body = '# Doc\n') =>
  `---\n${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n\n${body}`;
const base = { title: 'A doc', owner: 'Owner', created: '2026-10-01', 'last-reviewed': '2026-11-01' };
const readme = (extra = '') => fm({ ...base, type: 'reference', status: 'active' },
  `# Docs\n\n<!-- docs-check:vocabulary -->\n\`\`\`yaml\n${DEFAULT_VOCABULARY_YAML}${extra}\n\`\`\`\n`);

async function check(files) {
  const { problems } = await runChecks(fixture({ 'docs/README.md': readme(), ...files }), { today: TODAY });
  return problems.map(p => `${p.level}:${p.check}:${p.file}:${p.message}`);
}

test('yaml: maps, lists, flow lists, quotes, anchors, block scalars and nulls', () => {
  const v = parseYaml([
    'title: "ADR-0001: Quoted & fine"',
    'plain: Image Pipeline & Protection 2026 (plan of record)',
    "single: 'it''s'",
    'tags: [api, "a, b", web]',
    'related:',
    '  - ../a.md',
    '  - https://example.com/x',
    'same-indent:',
    '- one',
    'life: &l [draft, active]',
    'types:',
    '  plan: *l',
    'note: >-',
    '  folded',
    '  text',
    'nothing:',
    'n: 90',
    'items:',
    '  - path: src/a',
    '    doc: docs/a.md',
  ].join('\n'));
  assert.equal(v.title, 'ADR-0001: Quoted & fine');
  assert.equal(v.plain, 'Image Pipeline & Protection 2026 (plan of record)');
  assert.equal(v.single, "it's");
  assert.deepEqual(v.tags, ['api', 'a, b', 'web']);
  assert.deepEqual(v.related, ['../a.md', 'https://example.com/x']);
  assert.deepEqual(v['same-indent'], ['one']);
  assert.deepEqual(v.types.plan, ['draft', 'active']);
  assert.equal(v.note, 'folded text');
  assert.equal(v.nothing, null);
  assert.equal(v.n, 90);
  assert.deepEqual(v.items, [{ path: 'src/a', doc: 'docs/a.md' }]);
});

test('yaml: an unquoted colon, a duplicate key and an unknown alias are errors', () => {
  assert.throws(() => parseYaml('title: WP-1: a colon: inside'), /mapping values/);
  assert.throws(() => parseYaml('a: 1\na: 2'), /duplicate key/);
  assert.throws(() => parseYaml('a: *nope'), /unknown alias/);
  assert.throws(() => parseYaml('a: `x`'), /cannot start/);
});

test('markdown: GitHub anchors for punctuation, dashes, code and duplicates', () => {
  const doc = parseMarkdown('# Why — the inventory (measured)\n## `prime --diff` & more\n## Same\n## Same\nSetext\n---\n');
  assert.deepEqual([...doc.anchors], ['why--the-inventory-measured', 'prime---diff--more', 'same', 'same-1', 'setext']);
});

test('acceptance: a live plan needs numbered acceptance criteria; implemented plans and spec-linked plans do not', async () => {
  const plan = (status, body, extra = {}) => fm({ ...base, type: 'plan', status, ...extra }, body);
  const problems = await check({
    'docs/plans/a/x/README.md': plan('active', '# X\n## Acceptance criteria\n- **AC-1** Given a user, when …, then …\n'),
    'docs/plans/a/y/README.md': plan('active', '# Y\n## Scope\n'),
    'docs/plans/a/z/README.md': plan('draft', '# Z\n## Acceptance criteria\nGiven …\n'),
    'docs/plans/a/old/README.md': plan('implemented', '# Old\n'),
    'docs/plans/a/s/README.md': plan('active', '# S\n', { spec: '../../../specs/001-s/spec.md' }),
    'docs/specs/001-s/spec.md': fm({ ...base, type: 'spec', status: 'active' }, '# S\n- FR-001 …\n'),
    'docs/plans/a/x/architecture.md': plan('active', '# Part of plan x\n'),
  });
  const acceptance = problems.filter(p => p.includes(':acceptance:'));
  assert.equal(acceptance.length, 2);
  assert.ok(acceptance.some(p => p.includes('docs/plans/a/y/README.md') && p.includes('no "## Acceptance criteria"')));
  assert.ok(acceptance.some(p => p.includes('docs/plans/a/z/README.md') && p.includes('has no ids')));
  assert.ok(acceptance.every(p => p.startsWith('warn:')));
});

test('ids: a duplicated AC id, a reused ADR number and a reused spec number are errors', async () => {
  const problems = await check({
    'docs/plans/a/README.md': fm({ ...base, type: 'plan', status: 'active' }, '# A\n## Acceptance criteria\n- AC-1: one\n- AC-1: again\n'),
    'docs/architecture/decisions/adr-0003-a.md': fm({ ...base, type: 'adr', status: 'accepted' }),
    'docs/architecture/decisions/adr-0003-b.md': fm({ ...base, type: 'adr', status: 'accepted' }),
    'docs/specs/001-a/spec.md': fm({ ...base, type: 'spec', status: 'draft' }),
    'docs/specs/001-b/spec.md': fm({ ...base, type: 'spec', status: 'draft' }),
  });
  const ids = problems.filter(p => p.includes(':ids:'));
  assert.ok(ids.some(p => p.includes('AC-1 is defined twice')));
  assert.equal(ids.filter(p => p.includes('adr-0003')).length, 2);
  assert.equal(ids.filter(p => p.includes('specs/001-')).length, 2);
  assert.ok(ids.every(p => p.startsWith('error:')));
});

test('clarify: an open question blocks only a settled doc', async () => {
  const problems = await check({
    'docs/specs/001-a/spec.md': fm({ ...base, type: 'spec', status: 'draft' }, '# A\n[NEEDS CLARIFICATION: who pays?]\n'),
    'docs/specs/002-b/spec.md': fm({ ...base, type: 'spec', status: 'active' }, '# B\n[NEEDS CLARIFICATION: who pays?]\n'),
    'docs/specs/003-c/spec.md': fm({ ...base, type: 'spec', status: 'active' }, '# C\nOpen questions are written `[NEEDS CLARIFICATION: …]`.\n'),
  });
  const clarify = problems.filter(p => p.includes(':clarify:'));
  assert.equal(clarify.length, 1);
  assert.match(clarify[0], /002-b/);
});

test('actions: every incident action item has an owner', async () => {
  const table = owner => `# Outage\n## Action items\n| Action | Type | Owner | Ticket |\n|---|---|---|---|\n| Add alert | detect | ${owner} | #12 |\n`;
  const problems = await check({
    'docs/reference/incidents/a.md': fm({ ...base, type: 'incident', status: 'resolved' }, table('Ammar')),
    'docs/reference/incidents/b.md': fm({ ...base, type: 'incident', status: 'resolved' }, table('TBD')),
  });
  const actions = problems.filter(p => p.includes(':actions:'));
  assert.equal(actions.length, 1);
  assert.match(actions[0], /b\.md.*"Add alert" has no owner/);
});

test('drift: a moved file, a line past the end and a renamed symbol are reported; good citations pass', async () => {
  const code = 'export class QuotaService {\n  guard(user) {\n    return user.tier;\n  }\n}\n';
  const problems = await check({
    'src/QuotaService.js': code,
    'docs/reference/business-rules/quota.md': fm({ ...base, type: 'reference', status: 'active' }, [
      '# Quota',
      'Good: `src/QuotaService.js#QuotaService.guard`, `QuotaService.js:2`, `@./src/QuotaService.js#guard`, [link](../../../src/QuotaService.js#L2-L3).',
      'Bad: `src/Gone.js#guard`, `src/QuotaService.js:99`, `src/QuotaService.js#enforce`.',
      'Not citations: `docs/README.md#frontmatter`, `npm test`, `a.b`.',
    ].join('\n')),
  });
  const drift = problems.filter(p => p.includes(':drift:'));
  assert.equal(drift.length, 3, drift.join('\n'));
  assert.ok(drift.some(p => /Gone\.js is not a file/.test(p)));
  assert.ok(drift.some(p => /has only 5 lines/.test(p)));
  assert.ok(drift.some(p => /"enforce" is not in src\/QuotaService\.js/.test(p)));
});

test('drift: a locked citation whose code body changed is reported', () => {
  const repoBefore = fixture({ 'src/a.js': 'function guard() {\n  return 1;\n}\n', 'docs/a.md': '# A\n`src/a.js#guard`\n' });
  const doc = parseMarkdown(repoBefore.read('docs/a.md'));
  const [c] = citationsOf('docs/a.md', doc, repoBefore);
  const lock = { [citationKey(c)]: fingerprint(c, repoBefore.read('src/a.js').split('\n')) };
  assert.deepEqual(checkDrift('docs/a.md', doc, repoBefore, { lock }), []);
  const repoAfter = fixture({ 'src/a.js': 'function guard() {\n  return 2;\n}\n', 'docs/a.md': '# A\n`src/a.js#guard`\n' });
  assert.match(checkDrift('docs/a.md', doc, repoAfter, { lock })[0].message, /changed since the citation was locked/);
});

test('evidence: images under docs/ are reported unless their folder is allowed', async () => {
  const repo = fixture({
    'docs/README.md': readme().replace('evidence-allow: []', 'evidence-allow: [docs/design/]'),
    'docs/plans/shot.png': 'x',
    'docs/design/mock.png': 'x',
  });
  const { problems } = await runChecks(repo, { today: TODAY });
  const evidence = problems.filter(p => p.check === 'evidence');
  assert.deepEqual(evidence.map(p => p.file), ['docs/plans/shot.png']);
});

test('coverage: a listed module needs a current-state doc', async () => {
  const repo = fixture({
    'docs/README.md': readme().replace('modules: []', 'modules: [src/billing, src/ads]'),
    'docs/reference/modules/billing.md': fm({ ...base, type: 'reference', status: 'active' }),
  });
  const { problems } = await runChecks(repo, { today: TODAY });
  const coverage = problems.filter(p => p.check === 'coverage');
  assert.equal(coverage.length, 1);
  assert.match(coverage[0].message, /module src\/ads has no current-state doc/);
});

test('graduation (opt-in): an implemented plan nothing current links to is reported', async () => {
  const repo = fixture({
    'docs/README.md': readme().replace('graduation: off', 'graduation: error'),
    'docs/plans/a/done/README.md': fm({ ...base, type: 'plan', status: 'implemented' }),
    'docs/plans/a/kept/README.md': fm({ ...base, type: 'plan', status: 'implemented' }),
    'docs/reference/modules/a.md': fm({ ...base, type: 'reference', status: 'active' }, '# A\nHistory: [plan](../../plans/a/kept/)\n'),
  });
  const { problems } = await runChecks(repo, { today: TODAY });
  assert.deepEqual(problems.filter(p => p.check === 'graduation').map(p => p.file), ['docs/plans/a/done/README.md']);
});

test('no vocabulary block: the D³ default applies', async () => {
  const repo = fixture({ 'docs/a.md': fm({ ...base, type: 'spec', status: 'draft' }) });
  const { problems, vocabulary } = await runChecks(repo, { today: TODAY });
  assert.equal(vocabulary.source, 'default');
  assert.deepEqual(problems.filter(p => p.level === 'error'), []);
});

test('external links: private, loopback and metadata addresses are refused', async () => {
  const { isPrivateAddress, assertPublic } = await import('../src/links.mjs');
  for (const a of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1']) {
    assert.ok(isPrivateAddress(a), a);
  }
  for (const a of ['8.8.8.8', '1.1.1.1', '2606:4700::1111']) assert.ok(!isPrivateAddress(a), a);
  await assert.rejects(assertPublic('http://169.254.169.254/latest/meta-data/'), /private address/);
  await assert.rejects(assertPublic('file:///etc/passwd'), /not http/);
});

test('output: a value with a newline cannot start a GitHub workflow command', async () => {
  const { execFileSync } = await import('node:child_process');
  const root = mkdtempSync(path.join(tmpdir(), 'd3-inject-'));
  mkdirSync(path.join(root, 'docs'), { recursive: true });
  writeFileSync(path.join(root, 'docs/a.md'), fm({ ...base, type: 'guide', status: 'active', owner: '"x\\n::error::injected"', 'last-reviewed': '2026-01-01' }));
  const here = path.dirname(new URL(import.meta.url).pathname);
  const out = execFileSync('node', [path.join(here, '../check.mjs'), 'review-due', '--root', root, '--today', TODAY], { encoding: 'utf8', env: { ...process.env, GITHUB_ACTIONS: 'true', GITHUB_STEP_SUMMARY: '' } });
  assert.ok(out.includes('injected'));
  assert.ok(!out.split('\n').some(l => l.startsWith('::error::injected')), out);
});

test('the docs/README.md template carries exactly the default vocabulary', async () => {
  const { readFileSync } = await import('node:fs');
  const { parseVocabulary, parseVocabularyYaml } = await import('../src/vocabulary.mjs');
  const here = path.dirname(new URL(import.meta.url).pathname);
  const template = readFileSync(path.join(here, '../../../templates/repo/docs-README.md'), 'utf8');
  assert.deepEqual(parseVocabulary(template), parseVocabularyYaml(DEFAULT_VOCABULARY_YAML));
});

test('review fixes: a link to a missing code file is a links error, not a crash', async () => {
  const problems = await check({
    'docs/reference/a.md': fm({ ...base, type: 'reference', status: 'active' }, '# A\n[code](../../src/missing.ts) [dir](../../src/v1.2/)\n'),
  });
  assert.ok(problems.some(p => p.startsWith('error:links:') && p.includes('missing.ts')));
  assert.ok(!problems.some(p => p.includes(':drift:')));
});

test('review fixes: host:port and IP:port are not citations; a reversed range is reported', async () => {
  const problems = await check({
    'src/a.ts': 'export const a = 1;\n',
    'docs/runbooks/db.md': fm({ ...base, type: 'runbook', status: 'active' }, '# DB\nConnect to `db.internal:5432` or `127.0.0.1:6379`. See `src/a.ts:1-1` and `src/a.ts:1-0`.\n'),
  });
  const drift = problems.filter(p => p.includes(':drift:'));
  assert.equal(drift.length, 1, drift.join('\n'));
  assert.match(drift[0], /line range is reversed/);
});

test('review fixes: with --changed, a citation to a deleted file is still reported', () => {
  const repo = fixture({ 'docs/a.md': '# A\n`src/gone.ts#foo`\n' });
  const doc = parseMarkdown(repo.read('docs/a.md'));
  const [p] = checkDrift('docs/a.md', doc, repo, { changed: new Set(['src/gone.ts']) });
  assert.match(p.message, /gone\.ts is not a file/);
  assert.deepEqual(checkDrift('docs/a.md', doc, repo, { changed: new Set(['src/other.ts']) }), []);
});

test('review fixes: an Action items table without an Owner column is reported', async () => {
  const problems = await check({
    'docs/reference/incidents/x.md': fm({ ...base, type: 'incident', status: 'resolved' }, '# X\n## Action items\n| Action | Type | Ticket |\n|---|---|---|\n| Add alert | detect | #1 |\n'),
  });
  assert.ok(problems.some(p => p.includes(':actions:') && p.includes('no Owner column')));
});

test('review fixes: IPv4-mapped (hex form) and NAT64 addresses are private too', async () => {
  const { isPrivateAddress, assertPublic } = await import('../src/links.mjs');
  for (const a of ['::ffff:7f00:1', '::ffff:a9fe:a9fe', '64:ff9b::7f00:1', '64:ff9b::127.0.0.1', '::7f00:1']) assert.ok(isPrivateAddress(a), a);
  assert.ok(!isPrivateAddress('::ffff:808:808'));
  await assert.rejects(assertPublic('http://[::ffff:169.254.169.254]/latest/meta-data/'), /private address/);
  await assert.rejects(assertPublic('http://[64:ff9b::7f00:1]/'), /private address/);
});
