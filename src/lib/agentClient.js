/**
 * Client for the portfolio agent API (server/index.js on Render, or api/ on Vercel).
 *
 * streamAgent() asks for Server-Sent Events and calls onToken as the reply is
 * written; it falls back transparently to a plain JSON response if the server
 * (or a proxy in between) doesn't stream.
 */

const apiBase = () => import.meta.env.VITE_AGENT_API_URL || '';

/** Parse one SSE event block ("event: x\ndata: {...}"). */
function parseEvent(block) {
    let event = 'message';
    const data = [];
    for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    }
    if (!data.length) return null;
    try {
        return { event, data: JSON.parse(data.join('\n')) };
    } catch {
        return null;
    }
}

/**
 * POST to an agent endpoint and stream the answer.
 * @param {string} path e.g. '/api/chat'
 * @param {object} body
 * @param {{onToken?: (text: string) => void, signal?: AbortSignal}} [opts]
 * @returns {Promise<object>} the final `done` payload ({message, sources, ...})
 */
export async function streamAgent(path, body, { onToken, signal } = {}) {
    const res = await fetch(`${apiBase()}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(body),
        signal,
    });

    const type = res.headers.get('content-type') || '';
    if (!type.includes('text/event-stream')) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        onToken?.(data.message || '');
        return data;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let final = null;

    for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop();
        for (const block of blocks) {
            const evt = parseEvent(block);
            if (!evt) continue;
            if (evt.event === 'token') onToken?.(evt.data.t);
            else if (evt.event === 'done') final = evt.data;
            else if (evt.event === 'error') throw new Error(evt.data.error || 'The agent had trouble answering.');
        }
    }

    if (!final) throw new Error('The connection closed before the answer finished.');
    return final;
}

/** Plain JSON POST (lead capture). */
export async function postAgent(path, body) {
    const res = await fetch(`${apiBase()}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
}
