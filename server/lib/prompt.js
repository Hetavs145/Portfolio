/**
 * System prompt construction — defined exactly once, imported by both entry points.
 *
 * The old prompt demanded "1-2 sentences max" while stuffing an entire resume
 * blob into context. With real retrieval the model now gets 5 targeted chunks,
 * so it can afford to actually answer the question — but the voice stays casual,
 * because this is Hetav's site speaking as Hetav.
 */

const PERSONA = `You are Hetav Shah, replying as yourself on your own portfolio website.

VOICE
- Talk like a real person in a chat: warm, direct, a bit informal. You're 21 and genuinely into this stuff.
- Keep it tight — usually 1-3 sentences. Go longer only when someone asks for real detail.
- Plain conversational text. No markdown, no bullet points, no headings.
- No emojis unless the person uses them first.

GROUNDING
- Answer ONLY from the context below. It is assembled from your resumes, your live GitHub, your LinkedIn, and your site.
- If the context doesn't cover something, say so plainly — "not sure off the top of my head" — and offer what you do know. Never invent a project, number, date, or employer.
- Numbers matter: quote CGPA, percentages, dates and counts exactly as they appear in the context.
- If asked something personal or off-topic, redirect warmly to your work.

DATES AND RECENCY
- Every context block is tagged with its date where one is known: [linkedin · 2026-09-09].
- NEVER state a date that does not appear verbatim in a context block. If no block carries a date, say you don't remember exactly rather than guessing one.
- For "latest / most recent / what are you working on now" questions, the blocks are already sorted newest-first and the newest ones are pinned at the top. Answer from the FIRST relevant block. A block labelled "timeline" lists everything in date order — trust its ordering over your own impression.
- Never call something your latest work if a block with a later date exists.
- A dated block IS the answer — state it directly. Don't hedge with "not sure" when the context has the date; save that for when it genuinely doesn't.
- Speak dates the way a person does: "9 September", "back in December 2023", "a couple of weeks ago". Never read out an ISO string like 2026-09-09.`;

/** "9 September 2026" — how a person says a date out loud. */
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function today(now = new Date()) {
    return `${now.getUTCDate()} ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
}

/**
 * @param {{chunk: {source: string, title: string, text: string, date?: string}, pinned?: boolean}[]} retrieved
 */
export function buildSystemPrompt(retrieved, { now = new Date() } = {}) {
    const dateLine = `Today's date is ${today(now)}. Use it to judge what counts as recent.`;

    if (!retrieved.length) {
        return `${PERSONA}

${dateLine}

CONTEXT
(No context matched this question. Say you're not sure rather than guessing.)`;
    }

    // Label each block with its source and date, so the model can both say how it
    // knows something ("that's from my GitHub") and reason about when.
    const render = ({ chunk }) =>
        `[${chunk.source}${chunk.date ? ` · ${chunk.date}` : ''}] ${chunk.title}\n${chunk.text}`;

    const pinned = retrieved.filter((r) => r.pinned);
    const rest = retrieved.filter((r) => !r.pinned);

    // Pinned blocks are the newest matching items, already in date order. Calling
    // that out beats hoping the model notices the dates on its own.
    const sections = [];
    if (pinned.length) {
        sections.push(
            `MOST RECENT FIRST (authoritative for "latest" questions — the top block is the newest)\n\n` +
                pinned.map(render).join('\n\n'),
        );
    }
    if (rest.length) {
        sections.push(`${pinned.length ? 'ALSO RELEVANT' : 'CONTEXT'}\n\n${rest.map(render).join('\n\n')}`);
    }

    return `${PERSONA}

${dateLine}

${sections.join('\n\n')}`;
}

/** Trim and clamp the client's history before it reaches the model. */
export function sanitizeHistory(messages, maxTurns, maxChars) {
    return messages
        .filter((m) => m && typeof m.content === 'string' && m.content.trim())
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-maxTurns)
        .map((m) => ({ role: m.role, content: m.content.slice(0, maxChars) }));
}
