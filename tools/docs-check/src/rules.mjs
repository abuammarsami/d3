import { createHash } from 'node:crypto';
import path from 'node:path';
import { resolveTarget } from './links.mjs';

// The checks D³ adds on top of the base set (frontmatter, links, Mermaid, review-due).
// Each returns {line, message}[]; run.mjs applies the level (off / warn / error) from the vocabulary.

const ID_DEF = /^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\|\s*|#{1,6}\s+)?\**((?:AC|FR|SC)-\d+|T\d{3})\**\s*(?:[:.|)\]—–-]|\s|$)/;
const LIVE = new Set(['draft', 'in-review', 'active']);
const SETTLED = new Set(['active', 'accepted', 'implemented']);
const BINARY = /\.(png|jpe?g|gif|webp|bmp|tiff?|svg|drawio|vsdx?|psd|ai|sketch|fig|mp4|mov|webm|zip)$/i;

/** ADR numbers and spec folder numbers are unique (an immutable record must never share a number). */
export function checkNumbering(repo, isTemplate) {
  const problems = [];
  const seen = new Map();
  for (const file of repo.tracked) {
    let key = null;
    const adr = /^(.*\/)?adr-(\d{4})-[^/]*\.md$/.exec(file);
    if (adr && !isTemplate(file)) key = `${adr[1] ?? ''}adr-${adr[2]}`;
    const spec = /^(.*\/specs\/)(\d{3})-[^/]+\/spec\.md$/.exec(file);
    if (spec) key = `${spec[1]}${spec[2]}`;
    if (!key) continue;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(file);
  }
  for (const [key, files] of seen) {
    if (files.length < 2) continue;
    for (const file of files) problems.push({ file, line: 1, message: `number ${path.posix.basename(key)} is used by ${files.length} records: ${files.join(', ')}` });
  }
  return problems;
}

/** Inside one doc, each AC-n / FR-nnn / SC-nnn / Tnnn is defined once. */
export function checkIdDefinitions(doc) {
  const problems = [];
  const defined = new Map();
  forEachProseLine(doc, (text, no) => {
    const m = ID_DEF.exec(text);
    if (!m) return;
    if (defined.has(m[1])) problems.push({ line: no, message: `${m[1]} is defined twice (first on line ${defined.get(m[1])})` });
    else defined.set(m[1], no);
  });
  return problems;
}

export function definedIds(doc) {
  const ids = new Set();
  forEachProseLine(doc, text => {
    const m = ID_DEF.exec(text);
    if (m) ids.add(m[1]);
  });
  return ids;
}

/** An open question marker never survives into a doc that claims to be settled. */
export function checkClarify(doc, fm) {
  if (!SETTLED.has(fm?.status)) return [];
  const problems = [];
  forEachProseLine(doc, (text, no) => {
    if (text.includes('[NEEDS CLARIFICATION')) problems.push({ line: no, message: `open [NEEDS CLARIFICATION] in a doc whose status is ${fm.status}; answer it or move the doc back to draft` });
  });
  return problems;
}

/** A live plan carries acceptance criteria with ids that tasks, reviews and PRs can point at. */
export function checkAcceptance(file, doc, fm, repo) {
  if (fm?.type !== 'plan' || !LIVE.has(fm.status)) return [];
  const dir = path.posix.dirname(file);
  const isRoot = path.posix.basename(file) === 'README.md' || !repo.isFile(`${dir}/README.md`);
  if (!isRoot) return [];
  if (typeof fm.spec === 'string' && fm.spec.trim()) return [];
  const heading = doc.headings.find(h => /acceptance criteria/i.test(h.text));
  if (!heading) return [{ line: 1, message: 'live plan has no "## Acceptance criteria" section (AC-1, AC-2, … each Given/When/Then), and no spec: link' }];
  const ids = [...definedIds(doc)].filter(id => id.startsWith('AC-') || id.startsWith('FR-'));
  if (ids.length === 0) return [{ line: heading.line, message: 'Acceptance criteria section has no ids; number each criterion AC-1, AC-2, …' }];
  return [];
}

/** Every postmortem action item has an owner. */
export function checkActions(doc, fm) {
  if (fm?.type !== 'incident') return [];
  const problems = [];
  const lines = doc.lines;
  const start = doc.headings.find(h => /action items?/i.test(h.text));
  if (!start) return [{ line: 1, message: 'incident has no "Action items" section (Action | Type | Owner | Ticket)' }];
  let ownerCol = -1;
  for (let i = start.line; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,6}\s/.test(line)) break;
    if (!line.trim().startsWith('|')) continue;
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    if (ownerCol < 0) {
      ownerCol = cells.findIndex(c => /^owner$/i.test(c.replace(/\*/g, '')));
      continue;
    }
    if (cells.every(c => /^:?-+:?$/.test(c))) continue;
    const owner = (cells[ownerCol] ?? '').replace(/[*_`]/g, '').trim();
    if (!owner || /^(tbd|tba|\?|-|—|n\/a|none)$/i.test(owner)) problems.push({ line: i + 1, message: `action item "${cells[0]}" has no owner` });
  }
  return problems;
}

/**
 * The code a doc cites: `path:12`, `path:12-20`, `path#Symbol`, `@./path#Symbol` in code spans, and
 * links to non-Markdown files (with an optional #L12 or #L12-L20).
 */
export function citationsOf(file, doc, repo, aliases) {
  const out = [];
  const CITE = /^@?(?:\.\/)?([\w@/.-]*[\w-]\.[A-Za-z0-9]{1,8})(?::(\d+)(?:-(\d+))?|#([A-Za-z_$][\w$]*(?:(?:\.|::)[A-Za-z_$][\w$]*)*))$/;
  for (const span of doc.codeSpans) {
    const m = CITE.exec(span.text);
    if (!m || /\.md$/i.test(m[1])) continue;
    out.push({ raw: span.text, line: span.line, path: m[1], from: m[2] && Number(m[2]), to: m[3] && Number(m[3]), symbol: m[4] });
  }
  for (const link of doc.links) {
    if (!link.href) continue;
    const r = resolveTarget(file, link.href);
    if (!r || r.outside || /\.md$/i.test(r.target) || !/\.[A-Za-z0-9]{1,8}$/.test(r.target)) continue;
    const l = /^L(\d+)(?:-L(\d+))?$/.exec(r.fragment ?? '');
    out.push({ raw: link.href, line: link.line, path: r.target, resolved: r.target, from: l && Number(l[1]), to: l?.[2] && Number(l[2]), link: true });
  }
  for (const c of out) if (!c.resolved) c.resolved = resolveCited(c.path, file, repo, aliases);
  return out;
}

function resolveCited(p, file, repo, aliases = {}) {
  if (repo.isFile(p)) return p;
  for (const [short, full] of Object.entries(aliases)) {
    if (p.startsWith(short) && repo.isFile(full + p.slice(short.length))) return full + p.slice(short.length);
  }
  const rel = path.posix.normalize(path.posix.join(path.posix.dirname(file), p));
  if (repo.isFile(rel)) return rel;
  const hits = repo.byBasename(path.posix.basename(p));
  if (!p.includes('/')) {
    if (hits.length === 1) return hits[0];
    return hits.length > 1 ? { ambiguous: hits.length } : null;
  }
  // A shortened path (`App/Common/X.cs` for `src/Core/App/Common/X.cs`, or with the first folder
  // abbreviated): accept the one tracked file it is a suffix of. shortcut: unique match only; declare
  // the abbreviation in citation-aliases when two files share the tail.
  const tail = p.split('/').slice(1).join('/');
  const suffix = hits.filter(f => f.endsWith(`/${p}`));
  if (suffix.length === 1) return suffix[0];
  const loose = hits.filter(f => f.endsWith(`/${tail}`));
  if (loose.length === 1) return loose[0];
  return suffix.length + loose.length > 1 ? { ambiguous: suffix.length || loose.length } : null;
}

/** Cited code still exists where the doc says: file, line range, symbol, and (with a lock) content. */
export function checkDrift(file, doc, repo, { lock, changed, aliases } = {}) {
  const problems = [];
  for (const c of citationsOf(file, doc, repo, aliases)) {
    if (c.resolved && typeof c.resolved === 'object') continue; // ambiguous file name: cannot judge
    if (changed && !(c.resolved && changed.has(c.resolved))) continue;
    if (!c.resolved) {
      if (c.link) continue; // the links check already reports a missing link target
      problems.push({ line: c.line, message: `cites \`${c.raw}\`, but ${c.path} is not a file in this repository (moved or deleted?)` });
      continue;
    }
    const lines = repo.read(c.resolved).split('\n');
    const total = lines.length - (lines.at(-1) === '' ? 1 : 0);
    if (c.from && (c.from > total || (c.to && c.to > total))) {
      problems.push({ line: c.line, message: `cites \`${c.raw}\`, but ${c.resolved} has only ${total} lines` });
      continue;
    }
    if (c.symbol) {
      const parts = c.symbol.split(/\.|::/);
      const missing = parts.find(part => !new RegExp(`(^|[^\\w$])${escape(part)}([^\\w$]|$)`, 'm').test(lines.join('\n')));
      if (missing) {
        problems.push({ line: c.line, message: `cites \`${c.raw}\`, but "${missing}" is not in ${c.resolved} (renamed or removed?)` });
        continue;
      }
    }
    const key = citationKey(c);
    if (lock && key in lock && lock[key] !== fingerprint(c, lines)) {
      problems.push({ line: c.line, message: `cited code \`${c.raw}\` changed since the citation was locked; re-read it, update the doc, then run \`check.mjs lock\`` });
    }
  }
  return problems;
}

export const citationKey = c => `${c.resolved}${c.symbol ? `#${c.symbol}` : c.from ? `:${c.from}${c.to ? `-${c.to}` : ''}` : ''}`;

/** sha1 of the cited lines, or of the block that starts at the symbol and runs to the next blank line. */
export function fingerprint(c, lines) {
  let block;
  if (c.symbol) {
    const last = c.symbol.split(/\.|::/).at(-1);
    const re = new RegExp(`(^|[^\\w$])${escape(last)}([^\\w$]|$)`);
    const start = lines.findIndex(l => re.test(l));
    if (start < 0) return null;
    let end = start;
    while (end + 1 < lines.length && lines[end + 1].trim() !== '') end++;
    block = lines.slice(start, end + 1);
  } else if (c.from) block = lines.slice(c.from - 1, c.to ?? c.from);
  else return null;
  return createHash('sha1').update(block.map(l => l.trim()).join('\n')).digest('hex').slice(0, 12);
}

/** Images, binary diagrams and media stay out of docs/; evidence goes in the PR. */
export function checkEvidence(repo, vocabulary) {
  return [...repo.tracked]
    .filter(f => f.startsWith('docs/') && BINARY.test(f) && !vocabulary.evidenceAllow.some(p => f.startsWith(p)))
    .sort()
    .map(file => ({ file, line: 1, message: 'binary or image file under docs/: put screenshots and evidence in the PR description, diagrams in Mermaid (or allow the folder with evidence-allow)' }));
}

/** Each listed source module has a current-state doc. */
export function checkCoverage(repo, vocabulary, docs) {
  const problems = [];
  for (const mod of vocabulary.modules) {
    const name = path.posix.basename(mod.path);
    const named = mod.doc ? [mod.doc] : [`docs/reference/modules/${name}.md`, `docs/reference/modules/${name.toLowerCase()}.md`];
    if (named.some(f => repo.isFile(f))) continue;
    const covering = docs.find(d => [].concat(d.frontmatter.data?.covers ?? []).some(c => String(c).replace(/\/$/, '') === mod.path));
    if (covering) continue;
    problems.push({ file: 'docs/README.md', line: 1, message: `module ${mod.path} has no current-state doc (expected ${named[0]}, or a doc with covers: [${mod.path}])` });
  }
  return problems;
}

/** A shipped plan hands what outlives it to a permanent home: some non-plan doc links to it. */
export function checkGraduation(docs, inbound) {
  const problems = [];
  for (const { file, frontmatter } of docs) {
    const fm = frontmatter.data;
    if (fm?.type !== 'plan' || fm.status !== 'implemented') continue;
    const target = path.posix.basename(file) === 'README.md' ? path.posix.dirname(file) : file;
    const from = [...(inbound.get(file) ?? []), ...(inbound.get(target) ?? [])];
    if (!from.some(f => f.type && f.type !== 'plan')) {
      problems.push({ file, line: 1, message: 'implemented plan: no current-state doc (module, flow, view, rule, algorithm) links to it; move what outlives the plan to its permanent home and link back' });
    }
  }
  return problems;
}

function forEachProseLine(doc, fn) {
  let fence = null;
  doc.lines.forEach((line, i) => {
    if (i < doc.frontmatter.lineCount) return;
    const f = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (f) {
      if (!fence) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
      return;
    }
    if (!fence) fn(line, i + 1);
  });
}

const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
