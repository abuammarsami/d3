import { parseYaml } from './yaml.mjs';

export const VOCABULARY_SOURCE = 'docs/README.md';
const MARKER = '<!-- docs-check:vocabulary -->';

/** D³'s default vocabulary, used when docs/README.md carries no vocabulary block. Same schema as the block. */
export const DEFAULT_VOCABULARY_YAML = `required: [title, type, status, owner, created, last-reviewed]

lifecycle: &lifecycle [draft, in-review, active, implemented, deprecated]

types:
  plan: *lifecycle
  spec: *lifecycle
  tasks: *lifecycle
  guide: *lifecycle
  tutorial: *lifecycle
  reference: *lifecycle
  runbook: *lifecycle
  architecture: *lifecycle
  flow: *lifecycle
  algorithm: *lifecycle
  data-model: *lifecycle
  threat-model: *lifecycle
  glossary: *lifecycle
  legacy: *lifecycle
  adr: [proposed, accepted, rejected, superseded, deprecated]
  audit: [draft, in-review, active, resolved, deprecated]
  incident: [active, resolved]

review:
  default-days: 90
  exempt-types: [adr, audit, incident, legacy]
  exempt-statuses: [implemented, deprecated, superseded, rejected, resolved]

template-paths: [docs/templates/]
exempt-paths: []
# Paths no check reads at all (for example templates shipped for other repos).
ignore-paths: []

# D³ checks beyond the base set. Each is off, warn or error.
checks:
  acceptance: warn
  drift: warn
  evidence: warn
  actions: warn
  coverage: warn
  graduation: off

# Folders whose images are allowed under docs/ (for example a design handoff).
evidence-allow: []

# Source modules that must each have a current-state doc (coverage). Empty: coverage is skipped.
modules: []

# Short prefixes docs may use in citations, e.g. "App/": "src/Core/MyApp.Application/".
citation-aliases: {}
`;

const CHECK_DEFAULTS = { acceptance: 'warn', drift: 'warn', evidence: 'warn', actions: 'warn', coverage: 'warn', graduation: 'off' };
const LEVELS = new Set(['off', 'warn', 'error']);

/** Reads the vocabulary from the YAML block after the marker in docs/README.md, else the D³ default. */
export function loadVocabulary(repo) {
  const text = repo.isFile(VOCABULARY_SOURCE) ? repo.read(VOCABULARY_SOURCE) : '';
  if (!text.includes(MARKER)) return { ...parseVocabularyYaml(DEFAULT_VOCABULARY_YAML), source: 'default' };
  return { ...parseVocabulary(text), source: VOCABULARY_SOURCE };
}

export function parseVocabulary(text) {
  const at = text.indexOf(MARKER);
  if (at < 0) throw new Error(`${VOCABULARY_SOURCE} has no ${MARKER} block`);
  const match = /```ya?ml\n([\s\S]*?)\n```/.exec(text.slice(at));
  if (!match) throw new Error(`${VOCABULARY_SOURCE}: the ${MARKER} marker is not followed by a yaml fence`);
  return parseVocabularyYaml(match[1]);
}

export function parseVocabularyYaml(yamlText) {
  const v = parseYaml(yamlText);
  for (const key of ['required', 'types', 'review', 'template-paths']) {
    if (!v || !(key in v)) throw new Error(`${VOCABULARY_SOURCE} vocabulary lacks "${key}"`);
  }
  const checks = { ...CHECK_DEFAULTS, ...(v.checks ?? {}) };
  for (const [name, level] of Object.entries(checks)) {
    if (!LEVELS.has(level)) throw new Error(`vocabulary checks.${name} is "${level}"; use off, warn or error`);
  }
  return {
    required: v.required,
    types: new Map(Object.entries(v.types).map(([type, statuses]) => [type, new Set(statuses)])),
    reviewDays: v.review['default-days'],
    reviewExemptTypes: new Set(v.review['exempt-types']),
    reviewExemptStatuses: new Set(v.review['exempt-statuses']),
    templatePaths: v['template-paths'],
    exemptPaths: v['exempt-paths'] ?? [],
    ignorePaths: v['ignore-paths'] ?? [],
    checks,
    evidenceAllow: v['evidence-allow'] ?? [],
    citationAliases: v['citation-aliases'] ?? {},
    modules: (v.modules ?? []).map(m => (typeof m === 'string' ? { path: m.replace(/\/$/, '') } : { ...m, path: String(m.path).replace(/\/$/, '') })),
  };
}
