/**
 * Question shapes that similarity search answers badly, and the blocks to pin
 * for them (alongside contact intent in lib/actions.js).
 *
 *   Highlight  "What's your best project?" — no block shares those words, so the
 *              model hedged and then invented projects. Pin the best-projects
 *              block (lib/sources/site.js), or until the index has it, the
 *              Flagship and Featured project blocks.
 *   Self       "Tell me about your portfolio" — "portfolio" appears in every
 *              project block's title, so retrieval drifted to VaquaH. Pin the
 *              block about this site and its agent.
 */

import { projects } from '../../src/data/projects.js';

const HIGHLIGHT =
    /\b(best|favou?rite|proudest|top|strongest|flagship|biggest|greatest|most (impressive|proud|complex|challenging|interesting))\b[^?.!]{0,40}\b(projects?|works?|builds?|things? you('ve| have)? (built|made))\b|\bproud(est)? of\b/i;

const SELF =
    /\b(your|this)\s+(portfolio|site|website|web site|chat ?bot|bot|agent|assistant|rag)\b|\bhow (were|was|is) (you|this) (built|made|working)\b|\bhow do you work\b|\bwho (built|made) (you|this)\b|\bwhat are you\b/i;

export const hasHighlightIntent = (q) => HIGHLIGHT.test(String(q ?? ''));
export const hasSelfIntent = (q) => SELF.test(String(q ?? ''));

const projectChunk = (all, title) => all.find((c) => c.source === 'site' && c.title === `Portfolio project — ${title}`);

export function highlightChunks(all) {
    const best = all.filter((c) => c.source === 'site' && /^Best projects/.test(c.title));
    if (best.length) return best;
    return projects
        .filter((p) => p.featured === 'primary' || p.featured === 'secondary')
        .map((p) => projectChunk(all, p.title))
        .filter(Boolean);
}

export function selfChunks(all) {
    const self = projects.find((p) => p.title === 'Portfolio RAG Agent');
    return [self && projectChunk(all, self.title)].filter(Boolean);
}
