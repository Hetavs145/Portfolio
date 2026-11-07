/**
 * Shared /api/chat response logic for both entry points (server/index.js on
 * Render, api/chat.js on Vercel).
 *
 * Clients that send `Accept: text/event-stream` get Server-Sent Events:
 *
 *   event: token   data: {"t":"partial text"}        (repeated)
 *   event: done    data: {message, sources, ...}      (final, cleaned answer)
 *   event: error   data: {"error":"..."}
 *
 * Everyone else gets the original single JSON response, so older clients and
 * the eval harness keep working unchanged.
 */

import { answer } from './retrieve.js';
import { onAnswered } from './misses.js';
import { fitSummary } from './fit.js';

const BUSY = 'the free model pools are all busy right now — give it a minute and ask again';
const FAILED = 'The agent had trouble answering. Try again in a moment.';

const friendly = (err) => (err?.status === 429 ? BUSY : FAILED);

export const wantsStream = (req) => /text\/event-stream/i.test(req.headers?.accept || '');

/**
 * Run an answer-producing function and deliver it as JSON or as an SSE stream,
 * depending on what the client asked for.
 * @param {(onToken?: (t: string) => void) => Promise<object>} run
 * @param {(result: object) => void} [after] side effects once answered
 */
export async function respondAnswer(req, res, run, after) {
    if (!wantsStream(req)) {
        try {
            const result = await run();
            after?.(result);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(result));
        } catch (err) {
            console.error('[agent]', err.message);
            res.statusCode = err.status === 429 ? 503 : 502;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: friendly(err) }));
        }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // Stop reverse proxies (Render, nginx) from buffering the stream.
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    // Keep idle connections alive while retrieval and the first token are pending.
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 15_000);
    try {
        const result = await run((t) => send('token', { t }));
        after?.(result);
        send('done', result);
    } catch (err) {
        console.error('[agent:stream]', err.message);
        send('error', { error: friendly(err), partial: Boolean(err.partial) });
    } finally {
        clearInterval(heartbeat);
        res.end();
    }
}

/** /api/chat */
export function respondChat(req, res, messages) {
    return respondAnswer(
        req,
        res,
        (onToken) => answer(messages, { onToken }),
        (result) => onAnswered(messages, result),
    );
}

/** /api/fit — recruiter mode. */
export function respondFit(req, res, jd) {
    return respondAnswer(req, res, (onToken) => fitSummary(jd, { onToken }));
}
