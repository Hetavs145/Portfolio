/**
 * Question shapes that similarity search answers badly, and the blocks to pin
 * for them (alongside contact intent in lib/actions.js). Each was found by a
 * wrong answer from the live bot or from `eval.js --probe`.
 *
 *   Highlight  "What's your best project?" — no block shares those words, so the
 *              model hedged, invented projects, or crowned the wrong one.
 *   Count      "How many projects have you built?" — answered "4" from LinkedIn.
 *   Self       "Tell me about your portfolio" — "portfolio" is in every project
 *              block's title, so retrieval drifted to VaquaH.
 *   Education  "Have you graduated?" — answered "PDEU, finishing 2026" (PDEU is
 *              where he won a hackathon; he studies at Nirma until 2028).
 *   Identity   "Am I talking to a bot?" — needs the real contact details to hand.
 *   Experience "How long ago did your internship end?" — pin the dated entry.
 *              Education also covers "your PhD", so a false premise meets the
 *              block that corrects it.
 *
 * The derived blocks (best projects, project count) come from
 * lib/sources/site.js. If the committed index predates them, they are built on
 * the spot from the same data, so a pin never depends on a re-embed.
 */

import { siteChunks } from './sources/site.js';
import { makeChunk } from './chunk.js';
import { achievements } from '../../src/data/achievements.js';
import { contactChunks } from './actions.js';

const HIGHLIGHT =
    /\b(best|favou?rite|proudest|top|strongest|flagship|biggest|greatest|most (impressive|proud|complex|challenging|interesting))\b[^?.!]{0,40}\b(projects?|works?|builds?|things? you('ve| have)? (built|made))\b|\bproud(est)? of\b|\bbest project\b|\bproject kaunsa\b/i;

const COUNT = /\bhow many (projects|apps|things|systems|products|builds)\b|\bnumber of projects\b|\b(list|all) (of )?(your|his) projects\b/i;

const SELF =
    /\b(your|this)\s+(portfolio|site|website|web site|chat ?bot|bot|agent|assistant|rag)\b|\bhow (were|was|is) (you|this) (built|made|working)\b|\bhow do you work\b|\bwho (built|made) (you|this)\b|\bwhat are you\b/i;

const EDUCATION =
    /\b(graduat\w*|degree|college|universit\w*|studying|study at|semester|which year|what year|b\.? ?tech|mba|cgpa|grades?|academics?|school|ph\.? ?d|doctorate|masters?)\b|\bwhen (do|will) you (finish|complete)\b/i;

const EXPERIENCE = /\b(intern(ship)?s?|work experience|experience|employ\w*|job|worked (at|for)|company|companies)\b/i;

const IDENTITY =
    /\b(real (hetav|person|human|you)|are you (a |an )?(bot|ai|human|real|robot|person)|talking to (a |an |the )?(bot|ai|human|real|robot)|is this (a |an )?(bot|ai|human)|(a|an) (bot|ai) or)\b/i;

export const hasHighlightIntent = (q) => HIGHLIGHT.test(String(q ?? ''));
export const hasCountIntent = (q) => COUNT.test(String(q ?? ''));
export const hasSelfIntent = (q) => SELF.test(String(q ?? ''));
export const hasEducationIntent = (q) => EDUCATION.test(String(q ?? ''));
export const hasIdentityIntent = (q) => IDENTITY.test(String(q ?? ''));
export const hasExperienceIntent = (q) => EXPERIENCE.test(String(q ?? ''));
const RESUME = /\b(resumes?|résumés?|cv)\b/i;
export const hasResumeIntent = (q) => RESUME.test(String(q ?? ''));
/** "Do you have a separate MBA resume?" must meet the block saying the IMNU one isn't published. */
export const resumeChunks = (all) =>
    all.filter((c) => /^Resumes — which one/.test(c.title) || /^About the IMNU resume/.test(c.title));

/** A derived site block from the index, or built from the data if the index predates it. */
function derived(all, titleRe) {
    const indexed = all.filter((c) => c.source === 'site' && titleRe.test(c.title));
    return indexed.length ? indexed : siteChunks().filter((c) => titleRe.test(c.title));
}

export const highlightChunks = (all) => derived(all, /^Best projects/);
export const countChunks = (all) => derived(all, /^Projects — how many/);

export function selfChunks(all) {
    return all.filter((c) => c.source === 'site' && c.title === 'Portfolio project — Portfolio RAG Agent');
}

/**
 * "Have you graduated?" got "4th year of the Integrated B.Tech (2023–2026),
 * graduating 2026": the model mixed the B.Tech span with the programme's.
 * Where he stands today is computed here, from the Education card's own date
 * ranges (July academic year), and handed over as a plain fact.
 */
export function educationStatusChunk(now = new Date()) {
    const edu = achievements.find((a) => a.title === 'Education');
    if (!edu) return null;
    const y = now.getFullYear();
    const lateYear = now.getMonth() >= 6;
    const status = (from, to) => {
        if (y > to || (y === to && lateYear)) return `completed in ${to}`;
        const k = y - from + (lateYear ? 1 : 0);
        return k < 1 ? `starts in ${from}` : `in progress, year ${k} of ${to - from}, finishing in ${to}`;
    };
    const parts = [];
    const whole = /(\d{4})\s*[–-]\s*(\d{4})/.exec(edu.subtitle ?? '');
    for (const line of edu.details) {
        const m = /^(.*?)\s*\((\d{4})\s*[–-]\s*(\d{4})\)/.exec(line);
        if (m) parts.push(`${m[1].trim()}: ${status(Number(m[2]), Number(m[3]))}`);
    }
    if (!whole && !parts.length) return null;
    const month = now.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    const overall = whole ? status(Number(whole[1]), Number(whole[2])) : null;
    return makeChunk(
        'site',
        'Education — where Hetav is now',
        `As of ${month}: ${edu.details[0]} at ${(edu.subtitle ?? '').split(' · ')[0]}. ` +
            (overall ? `The whole programme (${whole[1]}–${whole[2]}) is ${overall}. ` : '') +
            parts.join('. ') +
            '. ' +
            (overall && !overall.startsWith('completed')
                ? `So he has not graduated from the programme yet; it finishes in ${whole[2]}.`
                : ''),
    );
}

export function educationChunks(all) {
    const want = [/^Portfolio section — Education/, /^Education —/, /^MBA specialisation/];
    return [educationStatusChunk(), ...want.flatMap((re) => all.filter((c) => re.test(c.title)).slice(0, 1))].filter(Boolean);
}

export const identityChunks = (all) => contactChunks(all);

/** The dated experience entries ("Jun 2025 -- Aug 2025"), so durations are computed, not guessed. */
export const experienceChunks = (all) => all.filter((c) => c.source === 'resume' && /^Experience —/.test(c.title));

/** Every topic pin for a message, in priority order. */
export function topicPins(latest, all) {
    return [
        ...(hasHighlightIntent(latest) ? highlightChunks(all) : []),
        ...(hasCountIntent(latest) ? countChunks(all) : []),
        ...(hasSelfIntent(latest) ? selfChunks(all) : []),
        ...(hasEducationIntent(latest) ? educationChunks(all) : []),
        ...(hasIdentityIntent(latest) ? identityChunks(all) : []),
        ...(hasExperienceIntent(latest) ? experienceChunks(all) : []),
        ...(hasResumeIntent(latest) ? resumeChunks(all) : []),
    ];
}
