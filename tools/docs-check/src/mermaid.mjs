// Mermaid's own grammar when it is installed (`npm i mermaid jsdom` next to this tool, or in the repo):
// mermaid.parse() runs the parser GitHub's renderer uses, without drawing. Without it, only the
// diagram header is checked, and the summary says so.

const KINDS = /^(flowchart|graph|sequenceDiagram|classDiagram(-v2)?|stateDiagram(-v2)?|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|mindmap|timeline|sankey(-beta)?|xychart(-beta)?|block(-beta)?|packet(-beta)?|kanban|architecture(-beta)?|radar(-beta)?|treemap(-beta)?|zenuml|info)\b/;

let loaded;

async function loadMermaid() {
  loaded ??= (async () => {
    try {
      const { JSDOM } = await import('jsdom');
      const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
      globalThis.window = dom.window;
      globalThis.document = dom.window.document;
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
      return mermaid;
    } catch {
      return null;
    }
  })();
  return loaded;
}

export async function mermaidMode() {
  return (await loadMermaid()) ? 'full parse' : 'header only (install mermaid + jsdom for a full parse)';
}

/** @param {{code: string, line: number}[]} blocks — line is the fence line */
export async function checkMermaid(blocks) {
  if (blocks.length === 0) return [];
  const mermaid = await loadMermaid();
  const problems = [];
  for (const { code, line } of blocks) {
    if (mermaid) {
      try {
        await mermaid.parse(code);
      } catch (e) {
        const detail = String(e?.message ?? e).split('\n').filter(Boolean).slice(0, 3).join(' | ');
        problems.push({ line, message: `Mermaid block does not parse: ${detail}` });
      }
      continue;
    }
    const body = code.replace(/^---\n[\s\S]*?\n---\n/, '');
    const first = body.split('\n').map(l => l.trim()).find(l => l && !l.startsWith('%%'));
    if (!first || !KINDS.test(first)) problems.push({ line, message: `Mermaid block does not start with a diagram type (got "${first ?? ''}")` });
  }
  return problems;
}
