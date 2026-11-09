#!/usr/bin/env node
// D³ docs-check: zero-dependency docs CI (Node 18+). Guide: README.md beside this file.
//   node check.mjs [check]            every check; exit 1 on any error (warnings never fail unless --strict)
//   node check.mjs review-due         living docs past their review date (report only, exit 0)
//   node check.mjs drift [--changed <base>]   only citation drift; --changed limits to code changed since <base>
//   node check.mjs cites <path>...    docs that cite these files or folders (for prime --diff and review)
//   node check.mjs lock               write docs/.d3/citations.lock (content fingerprints of cited code)
// Options: --root <dir>  --today YYYY-MM-DD  --only <check,...>  --strict  --json  --external
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { checkExternal } from './src/links.mjs';
import { loadRepo, findRoot } from './src/repo.mjs';
import { reviewDue } from './src/review.mjs';
import { runChecks } from './src/run.mjs';
import { isIsoDate } from './src/frontmatter.mjs';
import { mermaidMode } from './src/mermaid.mjs';
import { parseMarkdown } from './src/markdown.mjs';
import { loadVocabulary } from './src/vocabulary.mjs';
import { citationsOf, citationKey, fingerprint } from './src/rules.mjs';

const LOCK = 'docs/.d3/citations.lock';
const VALUE_OPTIONS = ['--root', '--today', '--only', '--changed'];
const args = process.argv.slice(2);
const option = name => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith('--') && !VALUE_OPTIONS.includes(args[i - 1]));
const command = positional[0] ?? 'check';
const today = option('--today') ?? new Date().toISOString().slice(0, 10);
const github = process.env.GITHUB_ACTIONS === 'true';
const json = args.includes('--json');

if (!isIsoDate(today)) fatal(`--today "${today}" is not a YYYY-MM-DD date`);
if (!['check', 'all', 'review-due', 'drift', 'cites', 'lock'].includes(command)) {
  fatal(`unknown command "${command}" (expected check, review-due, drift, cites or lock)`);
}

const started = Date.now();
const root = path.resolve(option('--root') ?? findRoot(process.cwd()));
const repo = loadRepo(root);

if (command === 'cites') {
  const wanted = positional.slice(1).map(p => p.replace(/\/$/, ''));
  if (wanted.length === 0) fatal('cites needs at least one path');
  const hits = citing(wanted);
  if (json) console.log(JSON.stringify(hits, null, 2));
  else for (const h of hits) say(`${h.doc}  ← ${h.cites.join(', ')}`);
  process.exit(0);
}

if (command === 'lock') {
  const lock = {};
  for (const { file, doc } of allMarkdown()) {
    for (const c of citationsOf(file, doc, repo, vocab().citationAliases)) {
      if (typeof c.resolved !== 'string') continue;
      const fp = fingerprint(c, repo.read(c.resolved).split('\n'));
      if (fp) lock[citationKey(c)] = fp;
    }
  }
  mkdirSync(path.join(root, path.dirname(LOCK)), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(lock).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(path.join(root, LOCK), `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`lock: ${Object.keys(sorted).length} citation fingerprint(s) written to ${LOCK}`);
  process.exit(0);
}

const lockPath = path.join(root, LOCK);
const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : undefined;
const changed = option('--changed') ? changedSince(option('--changed')) : undefined;
const result = await runChecks(repo, { today, lock, changed });

if (command === 'review-due') {
  reportReviewDue(reviewDue(result.docs, result.vocabulary, today));
  process.exit(0);
}

let only = option('--only')?.split(',').map(s => s.trim());
if (command === 'drift') only = ['drift'];
const problems = result.problems.filter(p => !only || only.includes(p.check));
const errors = problems.filter(p => p.level === 'error');
const warnings = problems.filter(p => p.level === 'warn');

if (json) {
  console.log(JSON.stringify({ errors, warnings, counts: result.counts, vocabulary: result.vocabulary.source }, null, 2));
} else {
  for (const p of [...errors, ...warnings]) {
    const tag = p.level === 'warn' ? `warning [${p.check}]` : `[${p.check}]`;
    say(`${p.file}:${p.line}: ${tag} ${p.message}`);
    if (github) annotate(p.level === 'warn' ? 'warning' : 'error', `file=${property(p.file)},line=${p.line},title=${property(`docs-check ${p.check}`)}`, p.message);
  }
  if (args.includes('--external')) await reportExternal(result);
  const { counts } = result;
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `docs-check: ${counts.frontmatter} frontmatter blocks, ${counts.links} links in ${counts.content} files, ` +
      `${counts.mermaid} Mermaid blocks (${await mermaidMode()}); vocabulary: ${result.vocabulary.source}` +
      `${result.driftSkipped ? '; drift: using fiberplane/drift (drift.lock)' : ''}` +
      `; ${errors.length} error(s), ${warnings.length} warning(s) in ${seconds}s`,
  );
}
process.exit(errors.length > 0 || (args.includes('--strict') && warnings.length > 0) ? 1 : 0);

function citing(wanted) {
  const under = target => typeof target === 'string' && wanted.some(w => target === w || target.startsWith(`${w}/`));
  return allMarkdown()
    .map(({ file, doc }) => {
      const cites = new Set();
      for (const c of citationsOf(file, doc, repo, vocab().citationAliases)) if (under(c.resolved)) cites.add(c.resolved);
      for (const w of wanted) if (doc.lines.some(l => l.includes(w))) cites.add(w);
      return { doc: file, cites: [...cites].sort() };
    })
    .filter(h => h.cites.length > 0 && !wanted.includes(h.doc));
}

/** Every Markdown file in the repository, parsed (contracts, READMEs and docs alike). */
function allMarkdown() {
  return [...repo.tracked].filter(f => f.endsWith('.md') && !/(^|\/)node_modules\//.test(f)).sort()
    .map(file => ({ file, doc: parseMarkdown(repo.read(file)) }));
}

function changedSince(base) {
  const git = a => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    // --relative: paths relative to --root, the same base as git ls-files there (a monorepo package).
    const names = `${git(['diff', '--name-only', '--relative', `${base}...HEAD`])}\n${git(['diff', '--name-only', '--relative', 'HEAD'])}`;
    return new Set(names.split('\n').filter(Boolean));
  } catch {
    fatal(`--changed: git could not diff against "${base}"`);
  }
}

function reportReviewDue(due) {
  if (json) {
    console.log(JSON.stringify(due, null, 2));
    return;
  }
  console.log(`review-due: ${due.length} living doc(s) past their review date (today ${today})`);
  for (const d of due) say(`  ${d.dueOn}  ${d.file}  [${d.type}/${d.status}, owner ${d.owner}, last reviewed ${d.lastReviewed}]`);
  if (!github || due.length === 0) return;
  console.log(`::warning title=Docs review due::${due.length} living doc(s) are past their review date; the job summary lists them. Review, then bump last-reviewed.`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const rows = due.map(d => `| ${cell(d.dueOn)} | \`${cell(d.file)}\` | ${cell(d.type)} / ${cell(d.status)} | ${cell(d.owner)} |`).join('\n');
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Docs past their review date (${due.length})\n\nNon-blocking. Review each doc against the code, then set \`last-reviewed\` to today.\n\n| Due | Doc | Type / status | Owner |\n|---|---|---|---|\n${rows}\n`,
    );
  }
}

async function reportExternal({ files, parse }) {
  const urls = new Set();
  for (const file of files.content) for (const { href } of parse(file).links) if (/^https?:\/\//i.test(href ?? '')) urls.add(href.split('#')[0]);
  const failures = await checkExternal([...urls]);
  console.log(`external: ${urls.size} URL(s) fetched, ${failures.length} did not answer (warnings only)`);
  for (const f of failures) {
    say(`  ${f.url}: ${f.reason}`);
    if (github) console.log(`::warning title=docs-check external link::${escape(`${f.url}: ${f.reason}`)}`);
  }
}

// Values printed here come from files a pull request can change. GitHub runs a workflow command only
// at the start of a line, so every printed line is folded to one line, and annotation fields are
// escaped as GitHub specifies.
function say(line) {
  const one = String(line).replace(/[\r\n\u2028\u2029]+/g, ' ');
  console.log(one.startsWith('::') ? ` ${one}` : one);
}

/** Our own GitHub annotation: the only output allowed to start with "::". */
function annotate(kind, props, message) {
  console.log(`::${kind} ${props}::${escape(message)}`.replace(/[\r\n]+/g, ' '));
}

function escape(s) {
  return String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

function property(s) {
  return escape(s).replace(/:/g, '%3A').replace(/,/g, '%2C');
}

function cell(s) {
  return String(s ?? '').replace(/[\r\n]+/g, ' ').replace(/\|/g, '\\|').replace(/`/g, "'");
}

function vocab() {
  vocab.cached ??= loadVocabulary(repo);
  return vocab.cached;
}

function fatal(message) {
  console.error(`docs-check: ${message}`);
  process.exit(2);
}
