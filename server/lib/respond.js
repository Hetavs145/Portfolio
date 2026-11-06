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

const BUSY = 'the free model pools are all busy right now — give it a minute and ask again';
const FAILED = 'The agent had trouble answering. Try again in a moment.';

const friendly = (err) => (err?.status === 429 ? BUSY : FAILED);

export const wantsStream = (req) => /text\/event-stream/i.test(req.headers?.accept || '');

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{role: string, content: string}[]} messages already validated
 */
export async function respondChat(req, res, messages) {
    if (!wantsStream(req)) {
        try {
            const result = await answer(messages);
            onAnswered(messages, result);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(result));
        } catch (err) {
            console.error('[chat]', err.message);
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
        const result = await answer(messages, { onToken: (t) => send('token', { t }) });
        onAnswered(messages, result);
        send('done', result);
    } catch (err) {
        console.error('[chat:stream]', err.message);
        send('error', { error: friendly(err), partial: Boolean(err.partial) });
    } finally {
        clearInterval(heartbeat);
        res.end();
    }
}
