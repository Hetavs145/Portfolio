/**
 * Citations: which context blocks an answer actually used, and how to show them.
 *
 * The model ends every reply with a machine-readable trailer:
 *
 *   [[sources: 2, 5]]   used blocks 2 and 5
 *   [[sources: none]]   small talk — nothing to cite
 *   [[unanswered]]      the context didn't contain the answer
 *
 * The trailer is stripped before anything reaches the visitor (including while
 * streaming — see StreamFilter), turned into source chips with links, and the
 * `unanswered` signal feeds the miss log (lib/misses.js).
 */

import { projects } from '../../src/data/projects.js';
import { hasContactIntent, contactActions } from './actions.js';

const LINKEDIN_PROFILE =
    process.env.LINKEDIN_PROFILE_URL || 'https://www.linkedin.com/in/hetav-shah-26601722b/';
const GITHUB_PROFILE = 'https://github.com/Hetavs145';

const TRAILER = /\[\[\s*(sources|unanswered)\b\s*:?\s*([^\]]*)\]\]/i;

/**
 * Split a raw completion into visible text and its citation trailer.
 * @returns {{text: string, cited: number[] | null, unanswered: boolean}}
 *   `cited` is null when the model forgot the trailer.
 */
export function parseTrailer(raw) {
    const m = TRAILER.exec(raw);
    if (!m) {
        const text = stripBlockRefs(raw).trim();
        return declined(text) ? { text, cited: [], unanswered: true } : { text, cited: null, unanswered: false };
    }
    const text = stripBlockRefs(raw.slice(0, m.index) + raw.slice(m.index + m[0].length)).trim();
    if (m[1].toLowerCase() === 'unanswered') return { text, cited: [], unanswered: true };
    const cited = [...m[2].matchAll(/\d+/g)].map((n) => Number(n[0]));
    // Backstop for a mislabelled trailer: a reply that cites nothing and says it
    // doesn't know is a miss, whatever the model tagged it as. Without this, a
    // "not sure off the top of my head" tagged [[sources: none]] was never
    // reported, so the question could never be answered and learned.
    if (!cited.length && declined(text)) return { text, cited: [], unanswered: true };
    return { text, cited, unanswered: false };
}

/**
 * Context block numbers ("[10]", "[3, 7]") are for the trailer only, but
 * models sometimes cite inline — "[10] NTS Global intern…" showed up in a
 * fit summary. Remove them from the visible text.
 */
export const BLOCK_REF = /[ \t]?\[\d{1,2}(?:\s*,\s*\d{1,2})*\](?!\()/g;
export const stripBlockRefs = (text) => String(text ?? '').replace(BLOCK_REF, '');

/** Phrases a reply uses when it couldn't answer from the context. */
const DECLINE =
    /\b(not sure|no idea|don['’]?t (really )?(know|have|remember|recall)|can['’]?t (say|recall|remember)|haven['’]?t (shared|mentioned|written|talked)|not something i['’]?(ve)? (shared|written|mentioned|covered|talked)|(isn['’]?t|not) (in|covered in|part of) (my|the) (notes|info|context|knowledge))/i;

const declined = (text) => DECLINE.test(text);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
};

/** "Repository — TrafficMind (1/2)" -> "TrafficMind" */
const afterDash = (title) => (title.split(' — ')[1] || title).replace(/\s*\(\d+\/\d+\)$/, '').trim();

/**
 * A visitor-facing label and link for one chunk. Relative links (the resumes)
 * resolve against the portfolio's own origin.
 */
export function sourceRef(chunk) {
    const { source, kind, title, url, date } = chunk;
    switch (source) {
        case 'linkedin':
            if (kind === 'post') return { type: 'linkedin', label: `LinkedIn post · ${shortDate(date)}`, url: url || LINKEDIN_PROFILE };
            return { type: 'linkedin', label: kind === 'timeline' || kind === 'stats' ? 'LinkedIn posts' : 'LinkedIn profile', url: LINKEDIN_PROFILE };
        case 'github':
            if (kind === 'repo' || kind === 'commit') return { type: 'github', label: `GitHub · ${afterDash(title)}`, url: url || GITHUB_PROFILE };
            return { type: 'github', label: 'GitHub activity', url: GITHUB_PROFILE };
        case 'resume':
            return { type: 'resume', label: 'Resume', url: '/Hetav_Shah_Resume.pdf' };
        case 'resume-imnu':
            // Not published on the site any more, so the chip names it without linking.
            return { type: 'resume', label: 'IMNU Resume', url: null };
        case 'site': {
            const project = projects.find((p) => title.endsWith(p.title));
            if (project) return { type: 'project', label: project.title, url: project.live || project.github || '#work' };
            return { type: 'site', label: 'Portfolio', url: /education|certif|hackathon|responsib|competition/i.test(title) ? '#achievements' : '#about' };
        }
        case 'website':
            return { type: 'site', label: 'Portfolio site', url: url || '/' };
        case 'faq':
            return { type: 'faq', label: 'Hetav’s notes', url: null };
        default:
            return { type: source, label: source, url: url || null };
    }
}

/* ------------------------------------------------------------- relevance --- */

/**
 * Words too common to show that a block and a reply are about the same thing.
 * Names are included because every block mentions Hetav.
 */
const STOP = new Set(
    ('this that with from have your about which what they them then also just like really more some been were ' +
        'will would could should into over only very here there their when where while does done make made want ' +
        'sure yes know need help chat talk thing things stuff good great happy love glad hetav hetavs shah portfolio ' +
        'website site page link links project projects work working build built using used other first last most ' +
        'time year years month months back still well much many each every both same such than them https http www')
        .split(' '),
);

/** Distinctive words: 4+ letters, folded, light plural stripping, minus STOP. */
function terms(text) {
    const out = new Set();
    for (const raw of String(text ?? '').normalize('NFKC').toLowerCase().match(/[a-z0-9][a-z0-9+#.-]{3,}/g) ?? []) {
        const w = raw.replace(/[.-]+$/, '').replace(/(?<=[a-z]{3})s$/, '');
        if (w.length >= 4 && !STOP.has(w)) out.add(w);
    }
    return out;
}

const overlap = (a, b) => {
    let n = 0;
    for (const w of a) if (b.has(w)) n++;
    return n;
};

/** How a reply refers to each project. Default alias: the full title. */
const ALIASES = {
    'VaquaH Cooling Service': ['vaquah'],
    'YouTube Upload Automation': ['youtube upload', 'youtube automation', 'upload automation', 'youtube-renderer'],
    'Drone Path-Finder': ['drone path', 'path-finder', 'pathfinder', 'path finder'],
    'Spam Detector': ['spam detect', 'spam email'],
    'Phishing Detector': ['phishing'],
    'Harzino Blog': ['harzino'],
    'Treat-o-Meter': ['treat-o-meter', 'treat o meter', 'treatometer'],
    'Portfolio RAG Agent': ['portfolio agent', 'portfolio chatbot', 'portfolio rag', 'rag-backed personal site', 'rag agent', 'this site'],
    'Cartoon Shorts Engine': ['cartoon shorts', 'cartoon engine', 'story studio'],
};
const aliasesOf = (p) => [p.title.toLowerCase(), ...(ALIASES[p.title] ?? [])];
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole words only: "Aven" must not match "haven't".
const aliasRe = new Map();
const mentions = (text, p) => {
    if (!aliasRe.has(p.title)) {
        aliasRe.set(p.title, new RegExp(`(?<![a-z0-9])(${aliasesOf(p).map(escape).join('|')})(?![a-z0-9])`, 'i'));
    }
    return aliasRe.get(p.title).test(String(text ?? ''));
};

/** GitHub repo names too generic to count as a mention on their own. */
const GENERIC_REPOS = /^(portfolio|small-projects)$/i;

/** Is this retrieved block genuinely what the reply talks about? */
function isRelevant(chunk, reply, replyTerms) {
    if (chunk.source === 'site') {
        const project = projects.find((p) => chunk.title.endsWith(p.title));
        if (project) return mentions(reply, project);
    }
    if (chunk.source === 'github' && (chunk.kind === 'repo' || chunk.kind === 'commit')) {
        const repo = afterDash(chunk.title);
        if (!GENERIC_REPOS.test(repo) && reply.toLowerCase().includes(repo.toLowerCase())) return true;
    }
    // Everything else must share real content with the reply, not just a topic.
    return overlap(replyTerms, terms(`${chunk.title} ${chunk.text}`)) >= 2;
}

/**
 * Chips under a reply, most useful first:
 *
 *   1. Contact buttons (Email / LinkedIn / Call) when the question is about
 *      getting in touch or hiring — see lib/actions.js.
 *   2. Every project the reply names, linked to its live site or repo, whether
 *      or not the model cited it.
 *   3. Blocks the model cited, kept only if they're relevant to what it said.
 *
 * Models sometimes forget the trailer or cite blocks they never used; showing
 * those produced chips like "Sign2Text" under "Sure, let's connect." A chip that
 * isn't about the reply is now dropped rather than shown.
 */
export function citedSources(hits, cited, { answer = '', question = '', limit = 4 } = {}) {
    const reply = String(answer ?? '');
    const replyTerms = terms(reply);
    const out = [];
    const seen = new Set();
    // One chip per destination: FlowPilot and its ET-Gen-Hackathon repo are the
    // same link, so the second would only add noise.
    const push = (ref) => {
        const key = ref.url || ref.label;
        if (seen.has(key) || out.length >= limit) return;
        seen.add(key);
        out.push(ref);
    };

    const contactIntent = hasContactIntent(question);
    if (contactIntent) contactActions().forEach(push);

    for (const p of projects) {
        if (mentions(reply, p)) {
            push({ type: 'project', label: p.title, url: p.live || p.github || '#work', id: `project:${p.title}`, date: null });
        }
    }

    const candidates = cited == null ? hits.slice(0, 4) : cited.map((n) => hits[n - 1]).filter(Boolean);
    for (const hit of candidates) {
        // The contact buttons already cover the contact blocks.
        if (contactIntent && /contact/i.test(hit.chunk.title)) continue;
        if (!isRelevant(hit.chunk, reply, replyTerms)) continue;
        push({ ...sourceRef(hit.chunk), id: hit.chunk.id, date: hit.chunk.date ?? null });
    }
    return out;
}

/**
 * Filters a token stream before it reaches the visitor: drops `<think>…</think>`
 * reasoning and stops at the citation trailer. Tokens arrive in arbitrary
 * fragments ("[[sou" + "rces: 2]]"), so anything that could be the start of a
 * marker is held back until it's clearly not one.
 */
export class StreamFilter {
    constructor(emit) {
        // After a dropped "[10]" the space before it was already sent, so swallow
        // one leading space of whatever comes next.
        this.emit = (t) => {
            if (this.skipSpace) {
                this.skipSpace = false;
                if (t.startsWith(' ')) t = t.slice(1);
                if (!t) return;
            }
            emit(t);
        };
        this.skipSpace = false;
        this.buf = '';
        this.inThink = false;
        this.done = false;
    }

    push(token) {
        if (this.done) return;
        this.buf += token;
        this.#drain(false);
    }

    /** Flush whatever is safe at end of stream. */
    end() {
        if (!this.done) this.#drain(true);
    }

    #drain(final) {
        for (;;) {
            if (this.inThink) {
                const close = this.buf.indexOf('</think>');
                if (close === -1) {
                    // Keep only a tail that might be a split closing tag.
                    this.buf = this.buf.slice(-8);
                    return;
                }
                this.buf = this.buf.slice(close + 8);
                this.inThink = false;
                continue;
            }

            const at = this.buf.search(/\[|</);
            if (at === -1) {
                if (this.buf) this.emit(this.buf);
                this.buf = '';
                return;
            }
            if (at > 0) {
                this.emit(this.buf.slice(0, at));
                this.buf = this.buf.slice(at);
            }

            const lower = this.buf.toLowerCase();
            const markers = ['[[sources', '[[unanswered', '<think>'];
            const full = markers.find((m) => lower.startsWith(m));
            if (full === '<think>') {
                this.buf = this.buf.slice(7);
                this.inThink = true;
                continue;
            }
            if (full) {
                // The trailer: nothing after it is for the visitor.
                this.done = true;
                this.buf = '';
                return;
            }
            // Inline block refs like "[10]" or "[3, 7]": drop them whole.
            const ref = /^\[\d{1,2}(?:\s*,\s*\d{1,2})*\]/.exec(this.buf);
            if (ref && this.buf[ref[0].length] !== '(') {
                this.buf = this.buf.slice(ref[0].length);
                this.skipSpace = true;
                continue;
            }
            const partialRef = /^\[\d{1,2}(?:\s*,\s*\d{0,2})*$/.test(this.buf) || (ref && this.buf.length === ref[0].length);
            const maybe = partialRef || markers.some((m) => m.startsWith(lower));
            if (maybe && !final) return; // wait for more text
            // Not a marker after all: release one character and keep scanning.
            this.emit(this.buf[0]);
            this.buf = this.buf.slice(1);
        }
    }
}
