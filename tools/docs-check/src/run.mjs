import { parseMarkdown } from './markdown.mjs';
import { checkFrontmatter, isTemplate } from './frontmatter.mjs';
import { checkLinks, resolveTarget } from './links.mjs';
import { checkMermaid } from './mermaid.mjs';
import { loadVocabulary } from './vocabulary.mjs';
import {
  checkAcceptance, checkActions, checkClarify, checkCoverage, checkDrift, checkEvidence,
  checkGraduation, checkIdDefinitions, checkNumbering,
} from './rules.mjs';

/**
 * The files each check covers. Frontmatter is a docs/ contract (minus the vocabulary's exempt paths);
 * links and Mermaid also cover every CLAUDE.md, AGENTS.md and README.md, and Markdown under database/.
 */
export function scope(repo, vocabulary) {
  const ignored = f => vocabulary.ignorePaths.some(p => f.startsWith(p));
  const docs = repo.markdownUnder('docs/').filter(f => !ignored(f));
  const withFrontmatter = docs.filter(f => !vocabulary.exemptPaths.some(p => f.startsWith(p)));
  const contracts = [...repo.tracked].filter(f => /(^|\/)(CLAUDE|AGENTS)\.md$/.test(f) && !f.startsWith('docs/') && !ignored(f));
  const outside = [...repo.tracked].filter(f => f.endsWith('.md') && !f.startsWith('docs/') && !contracts.includes(f)
    && !/(^|\/)node_modules\//.test(f) && !ignored(f) && (f.startsWith('database/') || f === 'README.md' || f.endsWith('/README.md')));
  return { frontmatter: withFrontmatter, content: [...docs, ...contracts.sort(), ...outside.sort()] };
}

/**
 * Runs every check and returns problems as {file, line, check, message, level}. Base checks are
 * errors; D³ rules take their level (off / warn / error) from the vocabulary's `checks:` map.
 * @param {{today: string, lock?: object, changed?: Set<string>}} options
 */
export async function runChecks(repo, { today, lock, changed } = {}) {
  const vocabulary = loadVocabulary(repo);
  const files = scope(repo, vocabulary);
  const template = f => isTemplate(f, vocabulary);
  const parsed = new Map();
  const parse = file => {
    if (!parsed.has(file)) parsed.set(file, parseMarkdown(repo.read(file)));
    return parsed.get(file);
  };
  const anchorsOf = file => (repo.isFile(file) ? parse(file).anchors : new Set());

  const problems = [];
  const add = (file, check, level = 'error') => p => problems.push({ file: p.file ?? file, line: p.line ?? 1, check, message: p.message, level });
  const rule = (name, file) => {
    const level = vocabulary.checks[name];
    return level === 'off' ? null : add(file, name, level);
  };

  for (const file of files.frontmatter) {
    const doc = parse(file);
    checkFrontmatter(file, doc.frontmatter, vocabulary, repo, today).forEach(add(file, 'frontmatter'));
    if (repo.hasBom(file)) add(file, 'frontmatter')({ line: 1, message: 'file starts with a UTF-8 BOM; save it as UTF-8 without BOM so YAML readers see the frontmatter' });
    if (template(file)) continue;
    const fm = doc.frontmatter.data;
    checkIdDefinitions(doc).forEach(add(file, 'ids'));
    checkClarify(doc, fm).forEach(add(file, 'clarify'));
    const acceptance = rule('acceptance', file);
    if (acceptance) checkAcceptance(file, doc, fm, repo).forEach(acceptance);
    const actions = rule('actions', file);
    if (actions) checkActions(doc, fm).forEach(actions);
  }
  checkNumbering(repo, template, f => vocabulary.ignorePaths.some(p => f.startsWith(p))).forEach(add(null, 'ids'));

  const drift = repo.isFile('drift.lock') ? null : rule('drift', null);
  for (const file of files.content) {
    const doc = parse(file);
    checkLinks(file, doc.links, repo, anchorsOf).forEach(add(file, 'links'));
    (await checkMermaid(doc.mermaid)).forEach(add(file, 'mermaid'));
    if (drift && !template(file) && !historical(doc.frontmatter.data, vocabulary)) checkDrift(file, doc, repo, { lock, changed, aliases: vocabulary.citationAliases }).forEach(p => drift({ ...p, file }));
  }

  const evidence = rule('evidence', null);
  if (evidence) checkEvidence(repo, vocabulary).forEach(evidence);
  const docs = files.frontmatter.map(file => ({ file, frontmatter: parse(file).frontmatter }));
  const coverage = rule('coverage', null);
  if (coverage) checkCoverage(repo, vocabulary, docs).forEach(coverage);
  const graduation = rule('graduation', null);
  if (graduation) checkGraduation(docs, inboundLinks(files.frontmatter, parse)).forEach(graduation);

  const counts = {
    frontmatter: files.frontmatter.length,
    content: files.content.length,
    links: files.content.reduce((n, f) => n + parse(f).links.length, 0),
    mermaid: files.content.reduce((n, f) => n + parse(f).mermaid.length, 0),
  };
  return { problems, counts, docs, vocabulary, parse, files, driftSkipped: repo.isFile('drift.lock') };
}

/** A record of a moment (ADR, audit, incident, shipped plan): its citations are history, not claims about today. */
function historical(fm, vocabulary) {
  if (!fm) return false;
  return vocabulary.reviewExemptTypes.has(fm.type) || vocabulary.reviewExemptStatuses.has(fm.status);
}

/** target path → the docs that link to it (with their type), from body links and related:. */
function inboundLinks(files, parse) {
  const inbound = new Map();
  for (const file of files) {
    const doc = parse(file);
    const type = doc.frontmatter.data?.type;
    const hrefs = [...doc.links.map(l => l.href), ...[].concat(doc.frontmatter.data?.related ?? [])];
    for (const href of hrefs) {
      if (typeof href !== 'string') continue;
      const r = resolveTarget(file, href.trim());
      if (!r || r.outside || r.target === file) continue;
      if (!inbound.has(r.target)) inbound.set(r.target, []);
      inbound.get(r.target).push({ file, type });
    }
  }
  return inbound;
}

