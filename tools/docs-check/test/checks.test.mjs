// Ported from the Partners (bareegaree) docs-check suite, where this checker started.
// Each rule is proven both ways: a valid input passes and a broken one is reported, so a check that
// silently stopped working would turn this suite red rather than leave docs CI green.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Repo } from '../src/repo.mjs';
import { parseMarkdown } from '../src/markdown.mjs';
import { checkFrontmatter } from '../src/frontmatter.mjs';
import { checkLinks } from '../src/links.mjs';
import { checkMermaid, mermaidMode } from '../src/mermaid.mjs';
import { reviewDue } from '../src/review.mjs';
import { parseVocabularyYaml, DEFAULT_VOCABULARY_YAML } from '../src/vocabulary.mjs';
import { runChecks } from '../src/run.mjs';

const vocabulary = parseVocabularyYaml(DEFAULT_VOCABULARY_YAML);
const vocabularyBlock = `<!-- docs-check:vocabulary -->\n\`\`\`yaml\n${DEFAULT_VOCABULARY_YAML}\n\`\`\`\n`;
const fullMermaid = (await mermaidMode()) === 'full parse';
const TODAY = '2026-11-02';

function fixture(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'docs-check-'));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    writeFileSync(path.join(root, name), content);
  }
  return new Repo(root, Object.keys(files));
}

const fm = (fields, body = '# Doc\n') =>
  `---\n${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n\n${body}`;
const valid = { title: 'A doc', type: 'plan', status: 'active', owner: 'Owner', created: '2026-10-01', 'last-reviewed': '2026-10-02' };

function frontmatterProblems(file, text, repo = fixture({ [file]: text })) {
  return checkFrontmatter(file, parseMarkdown(repo.read(file)).frontmatter, vocabulary, repo, TODAY).map(p => p.message);
}

test('the vocabulary in docs/README.md parses and carries the lifecycle', () => {
  assert.deepEqual([...vocabulary.types.get('plan')], ['draft', 'in-review', 'active', 'implemented', 'deprecated']);
  assert.ok(vocabulary.types.get('adr').has('superseded'));
  assert.ok(vocabulary.types.get('incident').has('resolved'));
  assert.equal(vocabulary.reviewDays, 90);
});

test('frontmatter: a valid block passes', () => {
  assert.deepEqual(frontmatterProblems('docs/a.md', fm(valid)), []);
});

test('frontmatter: a missing block, a missing key and an unknown status are each reported', () => {
  assert.match(frontmatterProblems('docs/a.md', '# No frontmatter\n')[0], /no frontmatter/);
  const { owner, ...noOwner } = valid;
  assert.ok(frontmatterProblems('docs/a.md', fm(noOwner)).some(m => /required key "owner"/.test(m)));
  assert.ok(frontmatterProblems('docs/a.md', fm({ ...valid, status: 'done' })).some(m => /status "done" is not allowed for type plan/.test(m)));
  assert.ok(frontmatterProblems('docs/a.md', fm({ ...valid, status: 'accepted' })).some(m => /not allowed for type plan/.test(m)));
  assert.ok(frontmatterProblems('docs/a.md', fm({ ...valid, type: 'research' })).some(m => /type "research"/.test(m)));
});

test('frontmatter: dates must be real, ordered and not in the future', () => {
  assert.ok(frontmatterProblems('docs/a.md', fm({ ...valid, created: '2026-02-30' })).some(m => /not a real/.test(m)));
  assert.ok(frontmatterProblems('docs/a.md', fm({ ...valid, created: '2026-10-05' })).some(m => /is after last-reviewed/.test(m)));
  assert.ok(frontmatterProblems('docs/a.md', fm({ ...valid, 'last-reviewed': '2027-01-01' })).some(m => /in the future/.test(m)));
  assert.ok(frontmatterProblems('docs/a.md', fm({ ...valid, 'review-due': '2026-01-01' })).some(m => /before last-reviewed/.test(m)));
});

test('frontmatter: snake_case keys, invalid YAML and a dangling related path are reported', () => {
  assert.ok(frontmatterProblems('docs/a.md', fm({ ...valid, last_reviewed: '2026-10-02' })).some(m => /not kebab-case/.test(m)));
  assert.ok(frontmatterProblems('docs/a.md', fm({ ...valid, title: 'WP-1: a colon: inside' })).some(m => /frontmatter YAML/.test(m)));
  const repo = fixture({ 'docs/a.md': `${fm(valid).replace('---\n\n', 'related:\n  - b.md\n  - gone.md\n---\n\n')}`, 'docs/b.md': fm(valid) });
  const problems = frontmatterProblems('docs/a.md', null, repo);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /related "gone.md" does not exist/);
});

test('frontmatter: a superseded ADR must name its successor', () => {
  const adr = { ...valid, type: 'adr', status: 'superseded', 'superseded-by': 'null' };
  assert.ok(frontmatterProblems('docs/adr.md', fm(adr)).some(m => /names its successor/.test(m)));
});

test('frontmatter: a template keeps placeholders but not an invalid status', () => {
  const template = { ...valid, created: 'YYYY-MM-DD', 'last-reviewed': 'YYYY-MM-DD' };
  assert.deepEqual(frontmatterProblems('docs/templates/x.md', fm(template)), []);
  assert.ok(frontmatterProblems('docs/templates/x.md', fm({ ...template, status: 'wip' })).length > 0);
});

function linkProblems(files, file) {
  const repo = fixture(files);
  const anchorsOf = f => parseMarkdown(repo.read(f)).anchors;
  return checkLinks(file, parseMarkdown(repo.read(file)).links, repo, anchorsOf).map(p => p.message);
}

test('links: good files, folders, headings, duplicate headings and HTML anchors pass', () => {
  const files = {
    'docs/a.md': '# A\n[b](b.md) [dir](sub/) [h](b.md#two-words) [dup](b.md#same-1) [html](b.md#custom) [self](#a) [url](https://example.com/x) [line](../src/x.cs#L10)\n',
    'docs/b.md': '# Two words\n## Same\n## Same\n<a id="custom"></a>\n',
    'docs/sub/c.md': '# C\n',
    'src/x.cs': '//',
  };
  assert.deepEqual(linkProblems(files, 'docs/a.md'), []);
});

test('links: a missing file, a missing anchor, a case mismatch and a climb out of the repo are reported', () => {
  const files = { 'docs/a.md': '# A\n[1](gone.md) [2](b.md#nope) [3](B.md) [4](../../outside.md)\n', 'docs/b.md': '# B\n' };
  const problems = linkProblems(files, 'docs/a.md');
  assert.equal(problems.length, 4);
  assert.match(problems[0], /broken link "gone.md"/);
  assert.match(problems[1], /broken anchor "b.md#nope"/);
  assert.match(problems[2], /case-sensitive/);
  assert.match(problems[3], /climbs above the repository root/);
});

test('links: a link inside a code span or fence is not a link', () => {
  assert.deepEqual(linkProblems({ 'docs/a.md': '# A\n`[x](gone.md)`\n\n```md\n[y](gone.md)\n```\n' }, 'docs/a.md'), []);
});

test('mermaid: a valid diagram passes and a broken one is reported at its fence line', { skip: !fullMermaid && 'mermaid not installed' }, async () => {
  const doc = parseMarkdown('# A\n\n```mermaid\nsequenceDiagram\n  A->>B: hi\n```\n\n```mermaid\nflowchart LR\n  A-->\n```\n');
  const problems = await checkMermaid(doc.mermaid);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].line, 8);
  assert.match(problems[0].message, /does not parse/);
});

test('mermaid: C4, ER and state diagrams are understood', async () => {
  const doc = parseMarkdown([
    '```mermaid\nC4Context\n  Person(u, "User")\n  System(s, "System")\n  Rel(u, s, "uses")\n```',
    '```mermaid\nerDiagram\n  A ||--o{ B : has\n```',
    '```mermaid\nstateDiagram-v2\n  [*] --> draft\n```',
  ].join('\n\n'));
  assert.deepEqual(await checkMermaid(doc.mermaid), []);
});

test('review-due: an overdue living doc is listed; records and overridden dates are not', () => {
  const doc = (file, fields) => ({ file, frontmatter: { data: { ...valid, ...fields } } });
  const due = reviewDue([
    doc('docs/old-guide.md', { type: 'guide', 'last-reviewed': '2026-07-01' }),
    doc('docs/shipped.md', { status: 'implemented', 'last-reviewed': '2026-01-01' }),
    doc('docs/shipped-unfinished.md', { status: 'implemented', 'status-note': 'SQL apply pending', 'last-reviewed': '2026-01-01' }),
    doc('docs/adr.md', { type: 'adr', status: 'accepted', 'last-reviewed': '2026-01-01' }),
    doc('docs/override.md', { 'last-reviewed': '2026-01-01', 'review-due': '2027-01-01' }),
    doc('docs/fresh.md', { 'last-reviewed': '2026-10-01' }),
    doc('docs/generated.md', { type: 'data-model', 'last-reviewed': '2026-01-01', 'generated-by': 'tools/docs-check/data-model.mjs' }),
  ], vocabulary, TODAY);
  assert.deepEqual(due.map(d => d.file), ['docs/shipped-unfinished.md', 'docs/old-guide.md']);
  assert.equal(due[1].dueOn, '2026-09-29');
});

test('scope: database notes and README files get link checks, but no frontmatter requirement', async () => {
  const repo = fixture({
    'docs/README.md': fm({ ...valid, type: 'reference' }, vocabularyBlock),
    'database/migrations/run.md': '# Run\n[gone](../../docs/gone.md)\n',
    'OnlineShop/README.md': '# Shop\n[gone](missing.md)\n',
  });
  const { problems } = await runChecks(repo, { today: TODAY });
  assert.deepEqual(problems.filter(p => p.level === 'error').map(p => `${p.file}:${p.check}`).sort(), ['OnlineShop/README.md:links', 'database/migrations/run.md:links']);
});

test('mermaid: without the mermaid package, a block that names no diagram type is reported', async () => {
  const doc = parseMarkdown('# A\n\n```mermaid\n%% note\nsequenceDiagram\n  A->>B: hi\n```\n\n```mermaid\nA-->B\n```\n');
  const problems = await checkMermaid(doc.mermaid);
  if (fullMermaid) assert.equal(problems.length, 1);
  else assert.deepEqual(problems.map(p => p.line), [9]);
});

test('end to end: CRLF files are read, a BOM is refused, and every check reports into one list', async () => {
  const repo = fixture({
    'docs/README.md': fm({ ...valid, type: 'reference' }, vocabularyBlock),
    'docs/good.md': fm(valid).replace(/\n/g, '\r\n'),
    'docs/bom.md': `\uFEFF${fm(valid)}`,
    'docs/bad.md': fm({ ...valid, status: 'complete' }, '# Bad\n[x](nowhere.md)\n\n```mermaid\nnot a diagram\n```\n'),
    'CLAUDE.md': '# Contract\n[gone](docs/gone.md)\n',
  });
  const { problems } = await runChecks(repo, { today: TODAY });
  const summary = problems.filter(p => p.level === 'error').map(p => `${p.file}:${p.check}`).sort();
  assert.deepEqual(summary, ['CLAUDE.md:links', 'docs/bad.md:frontmatter', 'docs/bad.md:links', 'docs/bad.md:mermaid', 'docs/bom.md:frontmatter']);
});

test('symlinks: a committed link to a file outside the repo is never read, and lock refuses to write through one', async () => {
  const { symlinkSync, readFileSync: read, existsSync } = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const { loadRepo } = await import('../src/repo.mjs');
  const outside = mkdtempSync(path.join(tmpdir(), 'outside-'));
  writeFileSync(path.join(outside, 'secret.md'), 'TOKEN=abc123\n');
  const root = mkdtempSync(path.join(tmpdir(), 'docs-check-'));
  mkdirSync(path.join(root, 'docs'));
  writeFileSync(path.join(root, 'docs/README.md'), fm({ ...valid, type: 'reference' }, vocabularyBlock));
  symlinkSync(path.join(outside, 'secret.md'), path.join(root, 'docs/leak.md'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['add', '-A'], { cwd: root });
  const repo = loadRepo(root);
  assert.ok(repo.isFile('docs/README.md'));
  assert.ok(!repo.isFile('docs/leak.md'), 'a symlink is not part of the checked set');
  // lock: docs/.d3 pointing outside must be refused, and nothing written there.
  symlinkSync(outside, path.join(root, 'docs/.d3'));
  const check = new URL('../check.mjs', import.meta.url).pathname;
  let code = 0;
  try {
    execFileSync('node', [check, 'lock', '--root', root], { stdio: 'pipe' });
  } catch (e) {
    code = e.status;
  }
  assert.equal(code, 2);
  assert.ok(!existsSync(path.join(outside, 'citations.lock')));
  assert.equal(read(path.join(outside, 'secret.md'), 'utf8'), 'TOKEN=abc123\n');
});
