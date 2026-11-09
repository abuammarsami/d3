import path from 'node:path';

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Resolves a link as GitHub does: `/x` from the repository root, anything else from the linking
 * file's folder. Returns null for a URL with a scheme (http, mailto, …), which is not a repository path.
 */
export function resolveTarget(fromFile, href) {
  if (SCHEME.test(href) || href.startsWith('//')) return null;
  const [pathPart, ...rest] = href.split('#');
  const fragment = rest.length > 0 ? rest.join('#') : null;
  let target = safeDecode(pathPart.split('?')[0]);
  if (target === '') return { target: fromFile, fragment, outside: false };
  target = target.startsWith('/')
    ? path.posix.normalize(target.slice(1))
    : path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), target));
  target = target.replace(/\/$/, '');
  return { target: target === '.' ? '' : target, fragment, outside: target.startsWith('..') };
}

function safeDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Checks every relative link in one file: the target is a tracked file or folder (case-sensitive, as
 * on GitHub and Linux), and a `#fragment` on a Markdown target names a heading or HTML anchor there.
 * @param {(file: string) => Set<string>} anchorsOf
 */
export function checkLinks(file, links, repo, anchorsOf) {
  const problems = [];
  for (const { href, line } of links) {
    if (!href) continue;
    const resolved = resolveTarget(file, href);
    if (resolved === null) continue;
    const { target, fragment, outside } = resolved;
    if (outside) {
      problems.push({ line, message: `link "${href}" climbs above the repository root` });
      continue;
    }
    if (!repo.exists(target)) {
      problems.push({ line, message: `broken link "${href}": ${target} is not a tracked file or folder${caseHint(repo, target)}` });
      continue;
    }
    if (fragment && repo.isFile(target) && target.endsWith('.md') && !isLineAnchor(fragment)) {
      const wanted = safeDecode(fragment).replace(/^user-content-/, '').toLowerCase();
      const anchors = anchorsOf(target);
      if (![...anchors].some(a => a.toLowerCase() === wanted)) {
        problems.push({ line, message: `broken anchor "${href}": ${target} has no heading or anchor "#${fragment}"` });
      }
    }
  }
  return problems;
}

function isLineAnchor(fragment) {
  return /^L\d+(-L\d+)?$/.test(fragment);
}

function caseHint(repo, target) {
  const actual = repo.caseInsensitive(target);
  return actual ? ` (the tracked path is ${actual}: paths are case-sensitive on GitHub)` : '';
}

/** Optional, non-blocking: fetches each external URL once and reports the ones that do not answer 2xx/3xx. */
export async function checkExternal(urls, { timeoutMs = 10000, concurrency = 8 } = {}) {
  const queue = [...urls];
  const failures = [];
  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      try {
        let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
        if (res.status === 405 || res.status === 403) {
          res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
        }
        if (res.status >= 400) failures.push({ url, reason: `HTTP ${res.status}` });
      } catch (e) {
        failures.push({ url, reason: e.name === 'TimeoutError' ? 'timeout' : e.message });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return failures;
}
