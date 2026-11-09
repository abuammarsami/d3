import { resolveTarget } from './links.mjs';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const KEY = /^[a-z][a-z0-9-]*$/;
const PATH_KEYS = ['supersedes', 'superseded-by', 'spec'];

/** True when `value` is a real calendar date written as YYYY-MM-DD. */
export function isIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isTemplate(file, vocabulary) {
  return vocabulary.templatePaths.some(p => (p.endsWith('/') ? file.startsWith(p) && !file.endsWith('/README.md') : file === p));
}

/**
 * Checks one document's frontmatter against the vocabulary. A template keeps its placeholders, so
 * only its shape (required keys, a real type and status) is checked, never its dates or paths.
 * @returns {{line: number, message: string}[]}
 */
export function checkFrontmatter(file, frontmatter, vocabulary, repo, today) {
  const problems = [];
  const fail = message => problems.push({ line: 1, message });

  if (!frontmatter.present) {
    fail('no frontmatter: every doc starts with the --- block defined in docs/README.md (or the D³ default)');
    return problems;
  }
  if (frontmatter.error) {
    fail(frontmatter.error);
    return problems;
  }

  const fm = frontmatter.data;
  for (const key of Object.keys(fm)) {
    if (!KEY.test(key)) fail(`key "${key}" is not kebab-case (did you mean "${key.replace(/[_A-Z]/g, c => (c === '_' ? '-' : `-${c.toLowerCase()}`))}"?)`);
  }
  for (const key of vocabulary.required) {
    if (fm[key] === undefined || fm[key] === null || String(fm[key]).trim() === '') fail(`required key "${key}" is missing or empty`);
  }

  const type = fm.type;
  if (type !== undefined && !vocabulary.types.has(type)) {
    fail(`type "${type}" is not one of: ${[...vocabulary.types.keys()].join(', ')}`);
  } else if (type !== undefined && fm.status !== undefined && !vocabulary.types.get(type).has(fm.status)) {
    fail(`status "${fm.status}" is not allowed for type ${type}; use one of: ${[...vocabulary.types.get(type)].join(', ')} (put any detail in status-note)`);
  }

  if (isTemplate(file, vocabulary)) return problems;

  for (const key of ['created', 'last-reviewed', 'review-due']) {
    if (fm[key] !== undefined && !isIsoDate(fm[key])) fail(`${key} "${fm[key]}" is not a real YYYY-MM-DD date`);
  }
  if (isIsoDate(fm.created) && isIsoDate(fm['last-reviewed']) && fm.created > fm['last-reviewed']) {
    fail(`created ${fm.created} is after last-reviewed ${fm['last-reviewed']}`);
  }
  if (isIsoDate(fm['last-reviewed']) && fm['last-reviewed'] > addDays(today, 1)) {
    fail(`last-reviewed ${fm['last-reviewed']} is in the future`);
  }
  if (isIsoDate(fm['review-due']) && isIsoDate(fm['last-reviewed']) && fm['review-due'] < fm['last-reviewed']) {
    fail(`review-due ${fm['review-due']} is before last-reviewed ${fm['last-reviewed']}`);
  }
  if (fm['status-note'] !== undefined && typeof fm['status-note'] !== 'string') fail('status-note must be one line of text');

  for (const key of ['tags', 'related']) {
    if (fm[key] !== undefined && fm[key] !== null && !Array.isArray(fm[key])) fail(`${key} must be a YAML list`);
  }
  for (const entry of Array.isArray(fm.related) ? fm.related : []) {
    if (typeof entry !== 'string') fail(`related entry ${JSON.stringify(entry)} is not a path`);
    else checkPath(entry, 'related', file, repo, fail);
  }
  for (const key of PATH_KEYS) {
    if (fm[key] === undefined || fm[key] === null || fm[key] === 'null') continue;
    if (typeof fm[key] !== 'string') fail(`${key} must be a relative path or null`);
    else checkPath(fm[key], key, file, repo, fail);
  }
  if (type === 'adr' && fm.status === 'superseded' && !fm['superseded-by']) {
    fail('a superseded ADR names its successor in superseded-by');
  }
  return problems;
}

function checkPath(entry, key, file, repo, fail) {
  const resolved = resolveTarget(file, entry.trim());
  if (resolved === null) return; // A URL, not a repository path.
  if (resolved.outside) fail(`${key} "${entry}" points outside the repository`);
  else if (!repo.exists(resolved.target)) fail(`${key} "${entry}" does not exist (resolved to ${resolved.target})`);
}

export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
