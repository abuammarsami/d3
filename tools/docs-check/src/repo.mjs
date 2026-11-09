import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * A snapshot of the repository the checks read: tracked files plus new, not-ignored ones (so a doc
 * just written by `capture` is checked before it is committed); gitignored files never count.
 * Paths are POSIX and repository-relative.
 */
export class Repo {
  /** @param {string} root @param {string[]} tracked */
  constructor(root, tracked) {
    this.root = root;
    this.tracked = new Set(tracked);
    this.directories = new Set();
    for (const file of tracked) {
      let dir = path.posix.dirname(file);
      while (dir !== '.' && !this.directories.has(dir)) {
        this.directories.add(dir);
        dir = path.posix.dirname(dir);
      }
    }
    this.cache = new Map();
  }

  /** Reads a tracked file as text with CRLF folded to LF, because a Windows checkout has CRLF. */
  read(relative) {
    if (!this.cache.has(relative)) {
      const text = readFileSync(path.join(this.root, relative), 'utf8');
      const bom = text.charCodeAt(0) === 0xfeff;
      this.cache.set(relative, { bom, text: (bom ? text.slice(1) : text).replace(/\r\n?/g, '\n') });
    }
    return this.cache.get(relative).text;
  }

  /** True when the file starts with a UTF-8 byte-order mark, which hides frontmatter from most YAML readers. */
  hasBom(relative) {
    this.read(relative);
    return this.cache.get(relative).bom;
  }

  exists(relative) {
    return relative === '' || this.tracked.has(relative) || this.directories.has(relative);
  }

  /** The tracked file or folder whose path matches `relative` ignoring case, or undefined. */
  caseInsensitive(relative) {
    this.lowered ??= new Map([...this.tracked, ...this.directories].map(p => [p.toLowerCase(), p]));
    return this.lowered.get(relative.toLowerCase());
  }

  isFile(relative) {
    return this.tracked.has(relative);
  }

  markdownUnder(prefix) {
    return [...this.tracked].filter(f => f.startsWith(prefix) && f.endsWith('.md')).sort();
  }

  /** Tracked files whose base name is `name` (a citation that gives only a file name). */
  byBasename(name) {
    if (!this.basenames) {
      this.basenames = new Map();
      for (const f of this.tracked) {
        const b = path.posix.basename(f);
        if (!this.basenames.has(b)) this.basenames.set(b, []);
        this.basenames.get(b).push(f);
      }
    }
    return this.basenames.get(name) ?? [];
  }
}

const SKIP = new Set(['.git', 'node_modules', '.venv', 'bin', 'obj', 'dist', 'build', '.next']);

/** Loads the repository at `root` from `git ls-files`; outside git, walks the folder (skipping build output). */
export function loadRepo(root) {
  let tracked;
  try {
    const output = execFileSync('git', ['-c', 'core.quotepath=off', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    tracked = output.split('\0').filter(Boolean);
  } catch {
    tracked = walk(root, '');
  }
  if (tracked.length === 0) throw new Error(`no files found in ${root}`);
  return new Repo(root, tracked);
}

function walk(root, rel) {
  const out = [];
  for (const name of readdirSync(path.join(root, rel))) {
    if (SKIP.has(name)) continue;
    const child = rel ? `${rel}/${name}` : name;
    const st = statSync(path.join(root, child));
    if (st.isDirectory()) out.push(...walk(root, child));
    else out.push(child);
  }
  return out;
}

/** The top of the git working tree that contains `start`, else `start` itself. */
export function findRoot(start) {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: start, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return start;
  }
}
