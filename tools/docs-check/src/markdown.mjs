import { parseYaml, YamlError } from './yaml.mjs';

// A line-based Markdown reader: just enough of CommonMark/GFM for what the checks need — headings
// (and the anchors GitHub derives from them), links, images, HTML ids, fenced code (and which fences
// are Mermaid), and inline code spans (which are citations, never links).
// shortcut: no indented-code blocks and no multi-line link text; upgrade to markdown-it if a repo
// trips on either.

const HTML_ID = /\b(?:id|name)\s*=\s*["']([^"']+)["']/gi;
const HTML_HREF = /\bhref\s*=\s*["']([^"']+)["']/gi;
const LINK_TAIL = /\]\(\s*(<[^>\n]*>|(?:[^()\s]|\((?:[^()\s])*\))*)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;
const REF_DEF = /^ {0,3}\[([^\]]+)\]:\s*<?([^\s>]+)>?/;

export function parseMarkdown(text) {
  const frontmatter = readFrontmatter(text);
  const lines = text.split('\n');
  const anchors = new Set();
  const slugs = new Map();
  const links = [];
  const mermaid = [];
  const codeSpans = [];
  const headings = [];

  let fence = null;
  let inComment = false;
  let prevParagraph = null; // the paragraph so far, which a setext underline could promote to a heading
  let carry = 0; // unclosed [ from earlier lines of the paragraph: link text that wraps

  for (let i = frontmatter.lineCount; i < lines.length; i++) {
    const no = i + 1;
    let line = lines[i];

    if (fence) {
      if (new RegExp(`^ {0,3}${fence.marker[0]}{${fence.marker.length},}\\s*$`).test(line.replace(/^(\s{0,3}>\s?)+/, ''))) {
        if (fence.info === 'mermaid') mermaid.push({ code: fence.body.join('\n'), line: fence.line });
        fence = null;
      } else fence.body.push(line);
      continue;
    }
    if (inComment) {
      if (line.includes('-->')) inComment = false;
      collectHtml(line, no, anchors, links);
      continue;
    }

    line = line.replace(/^(\s{0,3}>\s?)+/, '');
    const open = /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)/.exec(line);
    if (open) {
      fence = { marker: open[1], info: open[2].toLowerCase(), body: [], line: no };
      prevParagraph = null;
      continue;
    }
    if (/^\s*<!--/.test(line) && !line.includes('-->')) {
      inComment = true;
      collectHtml(line, no, anchors, links);
      continue;
    }
    if (/^\s*$/.test(line)) {
      prevParagraph = null;
      carry = 0;
      continue;
    }

    const setext = /^ {0,3}(=+|-+)\s*$/.exec(line);
    if (setext && prevParagraph) {
      addHeading(prevParagraph.text.replace(/\n/g, ''), prevParagraph.no, setext[1][0] === '=' ? 1 : 2);
      prevParagraph = null;
      continue;
    }

    const ref = REF_DEF.exec(line);
    if (ref && !/^\^/.test(ref[1])) {
      links.push({ href: ref[2], line: no });
      continue;
    }

    const { text: inline, spans } = stripCode(line);
    for (const s of spans) codeSpans.push({ text: s, line: no });

    const atx = /^ {0,3}(#{1,6})(?:\s+(.*?))?(?:\s+#+)?\s*$/.exec(line);
    if (atx) {
      addHeading(atx[2] ?? '', no, atx[1].length);
      collectInline(inline, no, anchors, links);
      prevParagraph = null;
      continue;
    }

    collectInline(inline, no, anchors, links, carry);
    const depth = Math.max(0, carry + count(inline, '[') - count(inline, ']'));
    const block = /^\s*([-*+]\s|\d+[.)]\s|\||<|#)/.test(line) || /^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(line);
    prevParagraph = block ? null : prevParagraph ? { ...prevParagraph, text: `${prevParagraph.text}\n${line.trim()}` } : { text: line.trim(), no };
    carry = depth;
  }

  return { frontmatter, anchors, links, mermaid, codeSpans, headings, lines };

  function addHeading(raw, no, level) {
    const text = plainText(raw);
    headings.push({ text, line: no, level });
    anchors.add(slug(text));
  }

  function slug(text) {
    const base = text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '').replace(/ /g, '-');
    let candidate = base;
    if (slugs.has(base)) {
      let n = slugs.get(base);
      do candidate = `${base}-${++n}`; while (slugs.has(candidate));
      slugs.set(base, n);
    }
    slugs.set(candidate, 0);
    return candidate;
  }
}

/** Heading text as GitHub reads it for the anchor: markup gone, link and code text kept. */
function plainText(raw) {
  const code = [];
  return raw
    .replace(/(`+)(.*?)\1/g, (_, __, body) => `\u0000${code.push(body) - 1}\u0000`)
    .replace(/\\([\\`*_{}[\]()#+\-.!|<>~])/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\*+|~~/g, '')
    .replace(/(^|[^\p{L}\p{N}_])(__?)(?=\S)(.+?)(?<=\S)\2(?![\p{L}\p{N}_])/gu, '$1$3')
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, e) => decode(e))
    .replace(/\u0000(\d+)\u0000/g, (_, i) => code[i]);
}

function decode(e) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' }[e.toLowerCase()];
  if (named) return named;
  return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
}

const count = (s, c) => s.split(c).length - 1;

/** Blanks inline code spans (they hold citations and examples, never links) and returns their text. */
function stripCode(line) {
  const spans = [];
  let out = '';
  let i = 0;
  while (i < line.length) {
    if (line[i] === '\\' && line[i + 1] === '`') { out += '  '; i += 2; continue; }
    if (line[i] !== '`') { out += line[i++]; continue; }
    const run = /^`+/.exec(line.slice(i))[0];
    const close = line.indexOf(run, i + run.length);
    let end = close;
    // A closing run must be exactly as long as the opening one.
    while (end >= 0 && line[end + run.length] === '`') end = line.indexOf(run, end + run.length + 1);
    if (end < 0) { out += run; i += run.length; continue; }
    spans.push(line.slice(i + run.length, end).trim());
    out += ' '.repeat(end + run.length - i);
    i = end + run.length;
  }
  return { text: out, spans };
}

function collectInline(text, no, anchors, links, carry = 0) {
  const clean = text.replace(/\\[[\]()]/g, '  ');
  for (const m of clean.matchAll(/<([a-z][a-z0-9+.-]{1,31}:[^\s<>]*|[^\s<>@]+@[^\s<>@]+\.[a-z]+)>/gi)) {
    links.push({ href: m[1].includes(':') ? m[1] : `mailto:${m[1]}`, line: no });
  }
  for (const m of clean.matchAll(LINK_TAIL)) {
    if (!carry && !clean.slice(0, m.index).includes('[')) continue;
    let href = m[1];
    if (href.startsWith('<')) href = href.slice(1, -1);
    links.push({ href, line: no });
  }
  collectHtml(clean, no, anchors, links);
}

function collectHtml(html, no, anchors, links) {
  if (!html.includes('<')) return;
  for (const tag of html.matchAll(/<[a-zA-Z][^>]*>/g)) {
    for (const m of tag[0].matchAll(HTML_ID)) anchors.add(m[1]);
    for (const m of tag[0].matchAll(HTML_HREF)) links.push({ href: m[1], line: no });
  }
}

/**
 * Reads a leading `---` YAML block. `present: false` when the file has none; `error` when the block
 * is there but is not valid YAML or not a mapping.
 */
export function readFrontmatter(text) {
  if (!text.startsWith('---\n')) return { present: false, lineCount: 0, data: null, error: null };
  const close = text.indexOf('\n---', 3);
  if (close < 0) return { present: true, lineCount: 0, data: null, error: 'frontmatter has no closing ---' };
  const raw = text.slice(4, close + 1);
  const lineCount = raw.split('\n').length + 1;
  let data;
  try {
    data = parseYaml(raw);
  } catch (e) {
    if (!(e instanceof YamlError)) throw e;
    return { present: true, lineCount, data: null, error: `frontmatter YAML: ${e.message}` };
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { present: true, lineCount, data: null, error: 'frontmatter is not a key: value mapping' };
  }
  return { present: true, lineCount, data, error: null };
}
