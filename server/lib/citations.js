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
    if (!m) return { text: raw.trim(), cited: null, unanswered: false };
    const text = (raw.slice(0, m.index) + raw.slice(m.index + m[0].length)).trim();
    if (m[1].toLowerCase() === 'unanswered') return { text, cited: [], unanswered: true };
    const cited = [...m[2].matchAll(/\d+/g)].map((n) => Number(n[0]));
    return { text, cited, unanswered: false };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
};

/** "Repository — TrafficMind (1/2)" -> "TrafficMind" */
const afterDash = (title) => (title.split(' — ')[1] || title).replace(/\s*\(\d+\/\d+\)$/, '').trim();

/**
 * A visitor-facing label and link for one chunk. Relative links (the résumés)
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
            return { type: 'resume', label: 'Résumé', url: '/Hetav_Shah_Resume.pdf' };
        case 'resume-imnu':
            return { type: 'resume', label: 'IMNU résumé', url: '/Hetav_Shah_IMNU.pdf' };
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

/**
 * Source chips for an answer: the cited blocks, de-duplicated, in citation
 * order. When the model omitted the trailer, fall back to the top retrieved
 * blocks so an answer is never shown without provenance.
 */
export function citedSources(hits, cited, { fallback = 3 } = {}) {
    const picked =
        cited == null
            ? hits.slice(0, fallback)
            : cited.map((n) => hits[n - 1]).filter(Boolean);

    const seen = new Set();
    const out = [];
    for (const hit of picked) {
        const ref = sourceRef(hit.chunk);
        const key = `${ref.label}|${ref.url}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ ...ref, id: hit.chunk.id, date: hit.chunk.date ?? null });
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
        this.emit = emit;
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
            const maybe = markers.some((m) => m.startsWith(lower));
            if (maybe && !final) return; // wait for more text
            // Not a marker after all: release one character and keep scanning.
            this.emit(this.buf[0]);
            this.buf = this.buf.slice(1);
        }
    }
}
