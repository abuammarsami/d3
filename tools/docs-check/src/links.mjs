import path from 'node:path';
import { lookup } from 'node:dns/promises';
import { lookup as dnsLookup } from 'node:dns';
import http from 'node:http';
import https from 'node:https';
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
    const res = await request(url, method, timeoutMs);
    if (res.status < 300 || res.status >= 400 || !res.location) return res;
    url = new URL(res.location, url).href;
  }
  throw new Error('too many redirects');
}

/**
 * One request whose connection may only go to a public address. The check runs inside the socket's
 * own DNS lookup, so the address checked is the address connected to (no DNS-rebinding gap).
 */
function request(url, method, timeoutMs) {
  const u = new URL(url);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return Promise.reject(new Error(`refused: ${u.protocol} is not http(s)`));
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) && isPrivateAddress(host)) return Promise.reject(new Error(`refused: ${u.hostname} is a private address`));
  const lib = u.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(u, { method, lookup: publicLookup, timeout: timeoutMs, headers: { 'user-agent': 'd3-docs-check' } }, res => {
      res.resume();
      resolve({ status: res.statusCode, location: res.headers.location });
    });
    req.on('timeout', () => req.destroy(Object.assign(new Error('timeout'), { name: 'TimeoutError' })));
    req.on('error', reject);
    req.end();
  });
}

function publicLookup(hostname, options, callback) {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const bad = addresses.find(a => isPrivateAddress(a.address));
    if (bad) return callback(new Error(`refused: ${hostname} resolves to a private address`));
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
}

/** Throws when the URL is not http(s) or its host resolves to a private address. */
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
    const embedded = embeddedIPv4(a);
    if (embedded) return isPrivateAddress(embedded);
    return a === '::' || a === '::1' || /^f[cd]/.test(a) || /^fe[89ab]/.test(a);
  }
  const [x, y] = address.split('.').map(Number);
  return x === 0 || x === 10 || x === 127 || (x === 100 && y >= 64 && y <= 127) || (x === 169 && y === 254)
    || (x === 172 && y >= 16 && y <= 31) || (x === 192 && y === 168) || x >= 224;
}

/** The IPv4 inside an IPv4-mapped (::ffff:0:0/96), compatible (::/96) or NAT64 (64:ff9b::/96) address, in either notation. */
function embeddedIPv4(a) {
  const dotted = /^(?:::ffff:|::|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/.exec(a);
  if (dotted) return dotted[1];
  const hex = /^(?:::ffff:|::|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(a);
  if (!hex) return null;
  const hi = parseInt(hex[1], 16), lo = parseInt(hex[2], 16);
  return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
}
