import { addDays, isIsoDate, isTemplate } from './frontmatter.mjs';

/**
 * A `status-note` that names work still to do. A shipped record is exempt from review only while it
 * claims to be finished; a note like "SQL apply pending" keeps the doc on the list until it is settled.
 */
const UNFINISHED = /\b(pending|remaining|remain|deferred|not yet|todo|still to|to apply|unfinished|not started|awaiting|outstanding)\b/i;

/**
 * Lists living documents whose review date has passed: `review-due` when set, otherwise
 * `last-reviewed` plus the vocabulary's default period. Historical records (ADRs, dated audits,
 * incidents, implemented plans) are exempt, because they describe a moment, not the present.
 */
export function reviewDue(docs, vocabulary, today) {
  const due = [];
  for (const { file, frontmatter } of docs) {
    const fm = frontmatter.data;
    if (!fm || isTemplate(file, vocabulary)) continue;
    if (vocabulary.reviewExemptTypes.has(fm.type)) continue;
    // A generated page is rebuilt from its sources and CI fails when it is stale, so it never needs a reader's review.
    if (typeof fm['generated-by'] === 'string') continue;
    const unfinished = typeof fm['status-note'] === 'string' && UNFINISHED.test(fm['status-note']);
    if (vocabulary.reviewExemptStatuses.has(fm.status) && !unfinished) continue;
    if (!isIsoDate(fm['last-reviewed'])) continue;
    const dueOn = isIsoDate(fm['review-due']) ? fm['review-due'] : addDays(fm['last-reviewed'], vocabulary.reviewDays);
    if (dueOn < today) {
      due.push({ file, owner: fm.owner ?? '(no owner)', lastReviewed: fm['last-reviewed'], dueOn, status: fm.status, type: fm.type });
    }
  }
  return due.sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.file.localeCompare(b.file));
}
