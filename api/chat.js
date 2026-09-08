/**
 * Vercel serverless adapter.
 *
 * Deliberately thin: all logic lives in ../server/lib and is shared with
 * server/index.js. The previous version of this file was a byte-identical copy
 * of the Express server, so every prompt or context edit had to be made twice —
 * and they had already drifted (the blob claimed CGPA 7.04 against the resume's
 * 7.13, and neither mentioned Kontexo).
 *
 * Note: production currently runs the Express server on Render. This handler is
 * kept working so the project can be deployed either way.
 */

import { answer } from '../server/lib/retrieve.js';
import { allowedOrigins, MAX_MESSAGE_CHARS, MAX_HISTORY_TURNS } from '../server/lib/config.js';

export default async function handler(req, res) {
    const origins = allowedOrigins();
    const origin = req.headers.origin;

    if (!origins) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (origin && origins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    } else if (origin) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (!process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
    }

    const { messages } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages array required' });
    }
    if (messages.length > MAX_HISTORY_TURNS * 2) {
        return res.status(400).json({ error: 'Conversation too long' });
    }
    if (messages.some((m) => typeof m?.content === 'string' && m.content.length > MAX_MESSAGE_CHARS)) {
        return res.status(400).json({ error: `Messages must be under ${MAX_MESSAGE_CHARS} characters` });
    }

    try {
        return res.status(200).json(await answer(messages));
    } catch (err) {
        console.error('[chat]', err.message);
        if (err.status === 429) {
            return res.status(503).json({
                error: 'the free model pools are all busy right now — give it a minute and ask again',
            });
        }
        return res.status(502).json({ error: 'The agent had trouble answering. Try again in a moment.' });
    }
}
