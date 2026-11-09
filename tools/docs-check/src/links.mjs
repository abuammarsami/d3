import path from 'node:path';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

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

/**
 * Optional, non-blocking: fetches each external URL once and reports the ones that do not answer 2xx/3xx.
 * Runs in CI on pull requests, so a link must not turn the runner into a probe of its own network:
 * only http(s), only hosts that resolve to public addresses, and every redirect hop is re-checked.
 */
export async function checkExternal(urls, { timeoutMs = 10000, concurrency = 8 } = {}) {
  const queue = [...urls];
  const failures = [];
  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      try {
        let res = await safeFetch(url, 'HEAD', timeoutMs);
        if (res.status === 405 || res.status === 403) res = await safeFetch(url, 'GET', timeoutMs);
        if (res.status >= 400) failures.push({ url, reason: `HTTP ${res.status}` });
      } catch (e) {
        failures.push({ url, reason: e.name === 'TimeoutError' ? 'timeout' : e.message });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return failures;
}

async function safeFetch(start, method, timeoutMs) {
  let url = start;
  for (let hop = 0; hop < 5; hop++) {
    await assertPublic(url);
    const res = await fetch(url, { method, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    if (res.status < 300 || res.status >= 400 || !res.headers.get('location')) return res;
    url = new URL(res.headers.get('location'), url).href;
  }
  throw new Error('too many redirects');
}

export async function assertPublic(url) {
  const { protocol, hostname } = new URL(url);
  if (protocol !== 'http:' && protocol !== 'https:') throw new Error(`refused: ${protocol} is not http(s)`);
  const host = hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  for (const { address } of addresses) {
    if (isPrivateAddress(address)) throw new Error(`refused: ${hostname} resolves to a private address`);
  }
}

/** Loopback, private, link-local (cloud metadata), carrier-grade NAT, unique-local and unspecified ranges. */
export function isPrivateAddress(address) {
  if (isIP(address) === 6) {
    const a = address.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(a);
    if (mapped) return isPrivateAddress(mapped[1]);
    return a === '::' || a === '::1' || /^f[cd]/.test(a) || /^fe[89ab]/.test(a);
  }
  const [x, y] = address.split('.').map(Number);
  return x === 0 || x === 10 || x === 127 || (x === 100 && y >= 64 && y <= 127) || (x === 169 && y === 254)
    || (x === 172 && y >= 16 && y <= 31) || (x === 192 && y === 168) || x >= 224;
}
