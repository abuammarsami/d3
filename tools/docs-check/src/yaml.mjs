// A small YAML reader for frontmatter and the vocabulary block, so docs-check needs no npm install.
// shortcut: covers block maps and lists, flow lists/maps of scalars, quoted and plain scalars, block
// scalars (| >), anchors and aliases; no tags, no complex keys. Upgrade to the `yaml` package if a
// repo's frontmatter needs more — unsupported syntax is an error, never a silent misread.

export class YamlError extends Error {}

export function parseYaml(text) {
  const lines = [];
  text.split('\n').forEach((raw, i) => {
    if (/^\s*(#.*)?$/.test(raw)) return;
    if (/^\t/.test(raw)) throw new YamlError(`line ${i + 1}: tabs are not allowed for indentation`);
    const indent = raw.match(/^ */)[0].length;
    lines.push({ indent, text: raw.slice(indent).replace(/\s+$/, ''), raw, no: i + 1 });
  });
  if (lines.length === 0) return null;
  const state = { lines, i: 0, anchors: new Map(), raw: text.split('\n') };
  const value = parseBlock(state, lines[0].indent);
  if (state.i < lines.length) throw new YamlError(`line ${lines[state.i].no}: unexpected indentation`);
  return value;
}

const KEY_LINE = /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^\s"'#\-?:,[\]{}&*!|>%@`][^:]*?|-[^\s:][^:]*?)\s*:(?:\s+(.*))?$/;

function parseBlock(state, indent) {
  const line = state.lines[state.i];
  if (isSeqItem(line.text)) return parseSeq(state, indent);
  return parseMap(state, indent);
}

const isSeqItem = text => text === '-' || text.startsWith('- ');

function parseMap(state, indent) {
  const out = {};
  while (state.i < state.lines.length) {
    const line = state.lines[state.i];
    if (line.indent < indent) break;
    if (line.indent > indent) throw new YamlError(`line ${line.no}: unexpected indentation`);
    if (isSeqItem(line.text)) break;
    const m = KEY_LINE.exec(line.text);
    if (!m) throw new YamlError(`line ${line.no}: expected "key: value", got "${line.text}"`);
    const key = unquoteKey(m[1]);
    if (Object.prototype.hasOwnProperty.call(out, key)) throw new YamlError(`line ${line.no}: duplicate key "${key}"`);
    state.i++;
    out[key] = parseValue(state, m[2], indent, line);
  }
  return out;
}

function parseSeq(state, indent) {
  const out = [];
  while (state.i < state.lines.length) {
    const line = state.lines[state.i];
    if (line.indent < indent || !isSeqItem(line.text)) {
      if (line.indent > indent) throw new YamlError(`line ${line.no}: unexpected indentation`);
      break;
    }
    if (line.indent > indent) throw new YamlError(`line ${line.no}: unexpected indentation`);
    const rest = line.text === '-' ? '' : line.text.slice(2).trimStart();
    const restIndent = line.indent + (line.text.length - rest.length);
    if (rest !== '' && KEY_LINE.test(rest) && !/^["'[{]/.test(rest)) {
      // "- key: value": re-read the item as a mapping that starts at the item's text column.
      state.lines[state.i] = { ...line, indent: restIndent, text: rest };
      out.push(parseMap(state, restIndent));
      continue;
    }
    state.i++;
    out.push(parseValue(state, rest || undefined, indent, line, true));
  }
  return out;
}

function parseValue(state, rest, indent, line, inSeq = false) {
  let anchor = null;
  if (rest !== undefined) {
    const a = /^&([\w-]+)(?:\s+(.*))?$/.exec(rest);
    if (a) {
      anchor = a[1];
      rest = a[2];
    }
  }
  let value;
  const next = state.lines[state.i];
  if (rest === undefined || rest === '') {
    if (next && next.indent > indent) value = parseBlock(state, next.indent);
    else if (next && !inSeq && next.indent === indent && isSeqItem(next.text)) value = parseSeq(state, indent);
    else value = null;
  } else if (/^[|>][-+]?$/.test(rest)) {
    value = blockScalar(state, indent, rest);
  } else if (rest.startsWith('[') || rest.startsWith('{')) {
    let flow = rest;
    while (!flowClosed(flow) && state.i < state.lines.length) flow += ' ' + state.lines[state.i++].text;
    value = parseFlow(flow, line);
  } else {
    let text = rest;
    // A plain scalar may continue on more-indented lines; YAML folds them with a space.
    while (!/^["']/.test(text) && state.lines[state.i] && state.lines[state.i].indent > indent && !isSeqItem(state.lines[state.i].text)) {
      text += ' ' + state.lines[state.i++].text;
    }
    value = scalar(text, line, state.anchors);
  }
  if (anchor) state.anchors.set(anchor, value);
  return value;
}

function blockScalar(state, indent, header) {
  const parts = [];
  let blockIndent = null;
  const start = state.i;
  // Read raw source lines so blank lines inside the block survive.
  const firstNo = state.lines[start]?.no;
  while (state.i < state.lines.length && state.lines[state.i].indent > indent) state.i++;
  if (firstNo === undefined || state.i === start) return '';
  const lastNo = state.lines[state.i - 1].no;
  for (let n = firstNo; n <= lastNo; n++) {
    const raw = state.raw[n - 1];
    if (blockIndent === null && raw.trim() !== '') blockIndent = raw.match(/^ */)[0].length;
    parts.push(raw.slice(blockIndent ?? 0));
  }
  let out = header.startsWith('|') ? parts.join('\n') : parts.join(' ').replace(/ {2,}/g, ' ');
  if (!header.endsWith('-')) out += '\n';
  return out;
}

function flowClosed(s) {
  let depth = 0, quote = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === '\\' && quote === '"') i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
  }
  return depth <= 0;
}

function parseFlow(s, line) {
  const body = s.replace(/\s+#.*$/, '').trim();
  const open = body[0], close = open === '[' ? ']' : '}';
  if (!body.endsWith(close)) throw new YamlError(`line ${line.no}: unclosed ${open}`);
  const inner = body.slice(1, -1).trim();
  const items = splitFlow(inner, line).filter((x, i, a) => !(x === '' && i === a.length - 1));
  if (open === '[') return items.map(x => scalar(x, line));
  const out = {};
  for (const item of items) {
    const m = /^([^:]+?)\s*:\s*(.*)$/.exec(item);
    if (!m) throw new YamlError(`line ${line.no}: expected key: value inside {}`);
    out[unquoteKey(m[1])] = scalar(m[2], line);
  }
  return out;
}

function splitFlow(s, line) {
  if (s === '') return [];
  const out = [];
  let cur = '', quote = null, depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      cur += c;
      if (c === '\\' && quote === '"') cur += s[++i] ?? '';
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") { quote = c; cur += c; }
    else if (c === '[' || c === '{') throw new YamlError(`line ${line.no}: nested flow collections are not supported`);
    else if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

function scalar(text, line, anchors) {
  let s = text.trim();
  if (s.startsWith('"')) return doubleQuoted(s, line);
  if (s.startsWith("'")) return singleQuoted(s, line);
  s = s.replace(/\s+#.*$/, '');
  if (s.startsWith('*')) {
    const name = s.slice(1);
    if (!anchors?.has(name)) throw new YamlError(`line ${line.no}: unknown alias *${name}`);
    return anchors.get(name);
  }
  if (/^[@`!%]/.test(s)) throw new YamlError(`line ${line.no}: a plain value cannot start with "${s[0]}"; quote it`);
  if (/:(\s|$)/.test(s)) throw new YamlError(`line ${line.no}: mapping values are not allowed here; quote a value that contains ": "`);
  if (s === '' || s === '~' || s === 'null' || s === 'Null' || s === 'NULL') return null;
  if (/^(true|True|TRUE)$/.test(s)) return true;
  if (/^(false|False|FALSE)$/.test(s)) return false;
  if (/^[-+]?\d+$/.test(s)) return Number(s);
  if (/^[-+]?(\d+\.\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return Number(s);
  return s;
}

function doubleQuoted(s, line) {
  const m = /^"((?:[^"\\]|\\.)*)"(\s+#.*)?\s*$/.exec(s);
  if (!m) throw new YamlError(`line ${line.no}: unterminated or trailing text after "…"`);
  return m[1].replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, e) => {
    if (e[0] === 'u') return String.fromCharCode(parseInt(e.slice(1), 16));
    return { n: '\n', t: '\t', '"': '"', '\\': '\\', '/': '/', '0': '\0', r: '\r', ' ': ' ' }[e] ?? e;
  });
}

function singleQuoted(s, line) {
  const m = /^'((?:[^']|'')*)'(\s+#.*)?\s*$/.exec(s);
  if (!m) throw new YamlError(`line ${line.no}: unterminated or trailing text after '…'`);
  return m[1].replace(/''/g, "'");
}

function unquoteKey(k) {
  if (k.startsWith('"')) return doubleQuoted(k, { no: 0 });
  if (k.startsWith("'")) return singleQuoted(k, { no: 0 });
  return k.trim();
}
