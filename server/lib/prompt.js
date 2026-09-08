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
- If asked something personal or off-topic, redirect warmly to your work.`;

/**
 * @param {{chunk: {source: string, title: string, text: string}}[]} retrieved
 */
export function buildSystemPrompt(retrieved) {
    if (!retrieved.length) {
        return `${PERSONA}

CONTEXT
(No context matched this question. Say you're not sure rather than guessing.)`;
    }

    // Label each block with its source so the model can say how it knows something
    // ("that's from my GitHub" / "per my resume") rather than asserting flatly.
    const context = retrieved
        .map(({ chunk }) => `[${chunk.source}] ${chunk.title}\n${chunk.text}`)
        .join('\n\n');

    return `${PERSONA}

CONTEXT
${context}`;
}

/** Trim and clamp the client's history before it reaches the model. */
export function sanitizeHistory(messages, maxTurns, maxChars) {
    return messages
        .filter((m) => m && typeof m.content === 'string' && m.content.trim())
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-maxTurns)
        .map((m) => ({ role: m.role, content: m.content.slice(0, maxChars) }));
}
