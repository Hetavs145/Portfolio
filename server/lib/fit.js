/**
 * Recruiter mode: paste a job description, get an honest fit summary grounded
 * in the same knowledge base as the chat.
 *
 * Retrieval runs on the JD itself, and the core profile blocks (summary,
 * experience, skills) are always included so a JD that happens to share few
 * words with the corpus still gets judged against the whole profile.
 */

import { retrieve } from './retrieve.js';
import { allChunks } from './vectorstore.js';
import { chat, stripMarkdown } from './openrouter.js';
import { parseTrailer, citedSources, StreamFilter } from './citations.js';

export const MIN_JD_CHARS = 80;
export const MAX_JD_CHARS = 8000;

const CORE_TITLES = [/^Professional summary/i, /^Experience —/i, /^Skills —/i, /^Education —/i, /^Achievement —/i];

function coreHits() {
    return allChunks()
        .filter((c) => c.source === 'resume' && CORE_TITLES.some((re) => re.test(c.title)))
        .map((chunk) => ({ chunk, score: 0 }));
}

const FIT_PROMPT = `You assess how well Hetav Shah fits a job description, for a recruiter reading his portfolio site.

RULES
- Use ONLY the numbered context blocks below as evidence about Hetav. Never invent a skill, employer, date, metric or project.
- Be honest. A credible "partial match" or "gap" is worth more to a recruiter than inflated claims. If the JD asks for something the context doesn't show, list it as a gap — don't stretch an unrelated project to cover it.
- Write in third person ("Hetav has…"), plain text, no markdown headings or asterisks.

FORMAT (keep it scannable, under ~220 words)
Overall: one sentence with a verdict — Strong fit, Good fit, Partial fit, or Weak fit — and why.
Matches:
• requirement → the concrete evidence (project, role or credential)
Partial or adjacent:
• requirement → closest related experience
Gaps:
• requirement not shown in his profile
Worth asking him about: one short line.

CITING (machine-read, never shown)
- Each block starts with a number like [3]. End with one final line: [[sources: 1, 4, 7]] listing the blocks you relied on.`;

/**
 * @param {string} jd
 * @param {{onToken?: (t: string) => void}} [options]
 */
export async function fitSummary(jd, { onToken } = {}) {
    const text = jd.replace(/\s+/g, ' ').trim().slice(0, MAX_JD_CHARS);

    // Retrieval sees the start of the JD, where role and requirements usually sit.
    const { hits: found, mode } = await retrieve(text.slice(0, 1500), 10);
    const seen = new Set(found.map((h) => h.chunk.id));
    const hits = [...found, ...coreHits().filter((h) => !seen.has(h.chunk.id))].slice(0, 16);

    const context = hits
        .map((h, i) => `[${i + 1}] [${h.chunk.source}${h.chunk.date ? ` · ${h.chunk.date}` : ''}] ${h.chunk.title}\n${h.chunk.text}`)
        .join('\n\n');

    const filter = onToken ? new StreamFilter(onToken) : null;
    const { text: raw, model } = await chat(
        [
            { role: 'system', content: `${FIT_PROMPT}\n\nCONTEXT\n\n${context}` },
            { role: 'user', content: `Job description:\n\n${text}` },
        ],
        { maxTokens: 700, temperature: 0.3, ...(filter ? { onToken: (t) => filter.push(t) } : {}) },
    );
    filter?.end();

    const { text: body, cited } = parseTrailer(raw);
    return {
        message: stripMarkdown(body),
        sources: citedSources(hits, cited, { fallback: 4 }),
        mode,
        model,
    };
}
