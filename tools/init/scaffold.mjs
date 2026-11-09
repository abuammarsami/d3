#!/usr/bin/env node
// D³ init: lays down the docs system in a repository. Dry run by default — it prints every file it
// would create, skip or append to, and writes nothing until --apply. It never overwrites a file.
//   node scaffold.mjs [--root <dir>] [--owner <name>] [--today YYYY-MM-DD] [--apply] [--json]
// A repo that already has a docs system (docs/README.md with a vocabulary block) is only reported on.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const plugin = path.resolve(here, '../..');
const args = process.argv.slice(2);
const option = name => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const root = path.resolve(option('--root') ?? gitRoot(process.cwd()));
const today = option('--today') ?? new Date().toISOString().slice(0, 10);
const owner = option('--owner') ?? gitUser() ?? '<owner>';
const project = path.basename(root);
const apply = args.includes('--apply');

const BUCKETS = [
  ['architecture', 'Architecture', 'System-wide design: arc42 views, C4 diagrams, runtime flows and the immutable decision records. Explanation, in Diátaxis terms.'],
  ['architecture/decisions', 'Architecture decision records', 'One file per hard-to-reverse decision, `adr-NNNN-{kebab}.md`, numbered in order and never edited after acceptance: a changed decision is a new ADR that supersedes the old one.'],
  ['architecture/views', 'Architecture views', 'arc42 sections and C4 context, container and component views, each verified against the code.'],
  ['architecture/flows', 'Runtime flows', 'One request or job end to end, as a sequence diagram, with every refusal and side effect.'],
  ['plans', 'Plans', 'Future work, one folder per plan, grouped by module: `plans/{module}/{kebab}/README.md`. Each live plan has numbered acceptance criteria.'],
  ['specs', 'Specs', 'Optional product specs (`specs/NNN-{kebab}/spec.md`), written when the what-and-why of a feature needs its own review.'],
  ['runbooks', 'Runbooks', 'Operational procedures: deploy, rotate, recover. How-to, for operators.'],
  ['guides', 'Guides', 'Developer how-tos and standards.'],
  ['guides/tutorials', 'Tutorials', 'Learning paths: from a fresh clone to a first traced change.'],
  ['reference', 'Reference', 'Facts that change slowly and are looked up: how modules work today, business rules, algorithms, the domain and data model, security, generated catalogues, audits, incidents, the glossary.'],
  ['reference/modules', 'Module references', 'How each module works today — not why (an ADR) or how it will change (a plan).'],
  ['reference/business-rules', 'Business rules', 'Domain, pricing and entitlement rules, one page per domain, each rule cited to the code that enforces it.'],
  ['reference/algorithms', 'Algorithms', 'Rules where one wrong edit costs money or visibility: inputs, outputs, invariants and the tests that pin them.'],
  ['reference/domain', 'Domain model', 'Class diagrams per bounded context and the state machines of the status enums.'],
  ['reference/audits', 'Audits', 'Dated, immutable records of shipped bugs and parity findings: `YYYY-MM-DD-{kebab}.md`. Write a new dated file; never edit an old one.'],
  ['reference/incidents', 'Incidents', 'Blameless postmortems, one file per incident, each with owned action items.'],
  ['reference/security/threat-models', 'Threat models', 'STRIDE per surface, each threat with its mitigation in the code or an open item.'],
  ['reference/generated', 'Generated reference', 'Catalogues generated from the code (schema, API contract, error codes). Never hand-edited; notes go in a `*.notes.md` beside them.'],
  ['legacy', 'Legacy', 'How a retiring system worked, for migration context only.'],
];

const actions = [];
const plan = (kind, target, how) => actions.push({ kind, target, how });

const existing = existsSync(path.join(root, 'docs/README.md'))
  && readFileSync(path.join(root, 'docs/README.md'), 'utf8').includes('<!-- docs-check:vocabulary -->');

if (existing) {
  report(['docs/README.md already defines a docs system (vocabulary block found); init only reports on it.',
    ...missingInExisting().map(m => `  missing: ${m}`)]);
  process.exit(0);
}

plan('create', 'docs/README.md', () => fill(read('templates/repo/docs-README.md')));
for (const file of readdirSync(path.join(plugin, 'templates/docs')).filter(f => f.endsWith('.md')).sort()) {
  // The templates index is a real doc (dated); the templates themselves keep their placeholders.
  plan('create', `docs/templates/${file}`, () => (file === 'README.md' ? fill(read(`templates/docs/${file}`)) : read(`templates/docs/${file}`)));
}
for (const [dir, title, about] of BUCKETS) plan('create', `docs/${dir}/README.md`, () => bucket(dir, title, about));
plan('create', 'docs/reference/glossary.md', glossary);
plan('create', 'AGENTS.md', () => read('templates/repo/AGENTS.md').replaceAll('<Project>', project));
const claude = path.join(root, 'CLAUDE.md');
if (!existsSync(claude)) plan('create', 'CLAUDE.md', () => read('templates/repo/CLAUDE.md'));
else if (!/^@AGENTS\.md\s*$/m.test(readFileSync(claude, 'utf8'))) plan('append', 'CLAUDE.md', () => '\n\n@AGENTS.md\n');
plan('create', '.github/pull_request_template.md', () => read('templates/repo/pull_request_template.md'));
plan('create', '.github/workflows/docs-check.yml', () => read('templates/repo/docs-check.yml'));
for (const file of ['check.mjs', 'README.md', 'package.json', ...readdirSync(path.join(plugin, 'tools/docs-check/src')).map(f => `src/${f}`)]) {
  plan('copy', `tools/docs-check/${file}`, path.join(plugin, 'tools/docs-check', file));
}

for (const a of actions) {
  if (a.kind !== 'append' && existsSync(path.join(root, a.target))) a.kind = 'skip';
}

if (args.includes('--json')) {
  console.log(JSON.stringify(actions.map(({ kind, target }) => ({ kind, target })), null, 2));
} else {
  report([
    `${apply ? 'Applying' : 'Dry run'} — D³ init in ${root} (owner ${owner}, ${today})`,
    ...actions.map(a => `  ${a.kind.padEnd(6)} ${a.target}${a.kind === 'skip' ? '  (exists — left as is)' : ''}`),
    `${actions.filter(a => a.kind !== 'skip').length} to write, ${actions.filter(a => a.kind === 'skip').length} left as is.`,
    apply ? '' : 'Nothing written. Re-run with --apply to write these files.',
  ]);
}

if (apply) {
  for (const a of actions) {
    if (a.kind === 'skip') continue;
    const target = path.join(root, a.target);
    mkdirSync(path.dirname(target), { recursive: true });
    if (a.kind === 'copy') copyFileSync(a.how, target);
    else if (a.kind === 'append') appendFileSync(target, a.how());
    else writeFileSync(target, a.how(), { flag: 'wx' }); // wx: fail rather than overwrite, even in a race
  }
}

function missingInExisting() {
  const want = ['AGENTS.md', '.github/pull_request_template.md', 'docs/templates/plan.md', 'docs/reference/glossary.md'];
  const missing = want.filter(f => !existsSync(path.join(root, f)));
  if (!existsSync(path.join(root, 'tools/docs-check/check.mjs'))) missing.push('tools/docs-check (a docs linter)');
  const claudeFile = path.join(root, 'CLAUDE.md');
  if (existsSync(claudeFile) && existsSync(path.join(root, 'AGENTS.md')) && !/^@AGENTS\.md\s*$/m.test(readFileSync(claudeFile, 'utf8'))) {
    missing.push('CLAUDE.md does not import @AGENTS.md (Claude Code reads only CLAUDE.md when both exist)');
  }
  return missing;
}

function bucket(dir, title, about) {
  const up = dir.split('/').map(() => '..').join('/');
  return `${frontmatter(title, [`${up}/README.md`])}
# ${title}

${about}

| Doc | Status | Owner | Last reviewed |
|---|---|---|---|
`;
}

function glossary() {
  return `${frontmatter('Glossary', ['../README.md'], 'glossary')}
# Glossary

One \`###\` entry per term, alphabetical, defined the way the *code* uses it. Template:
[glossary entry](../templates/glossary-entry.md).
`;
}

function frontmatter(title, related, type = 'reference') {
  return `---
title: ${title}
type: ${type}
status: active
owner: ${owner}
created: ${today}
last-reviewed: ${today}
tags: [index]
related:
${related.map(r => `  - ${r}`).join('\n')}
supersedes: null
superseded-by: null
---
`;
}

function fill(text) {
  return text.replaceAll('<Project>', project).replace(/^owner: <name>$/m, `owner: ${owner}`)
    .replace(/^created: YYYY-MM-DD$/m, `created: ${today}`).replace(/^last-reviewed: YYYY-MM-DD$/m, `last-reviewed: ${today}`);
}

function read(rel) {
  return readFileSync(path.join(plugin, rel), 'utf8');
}

function report(lines) {
  console.log(lines.filter(l => l !== '').join('\n'));
}

function gitRoot(start) {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: start, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return start;
  }
}

function gitUser() {
  try {
    return execFileSync('git', ['config', 'user.name'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch {
    return null;
  }
}
