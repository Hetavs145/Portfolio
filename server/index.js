/**
 * Portfolio RAG agent — Express server (this is what Render runs).
 *
 * All the actual logic lives in ./lib and is shared with api/chat.js, so the two
 * entry points can no longer drift apart the way the old duplicated files did.
 */

import express from 'express';
import cors from 'cors';

import { answer } from './lib/retrieve.js';
import { loadIndex } from './lib/vectorstore.js';
import {
    allowedOrigins,
    MAX_MESSAGE_CHARS,
    MAX_HISTORY_TURNS,
    RATE_PER_MINUTE,
    RATE_PER_DAY,
} from './lib/config.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Render/Vercel sit behind a proxy; without this every client shares one IP.
app.set('trust proxy', 1);

const origins = allowedOrigins();
app.use(
    cors({
        origin(origin, cb) {
            // Non-browser callers (curl, health checks) send no Origin.
            if (!origin || !origins) return cb(null, true);
            if (origins.includes(origin)) return cb(null, true);
            cb(new Error(`Origin ${origin} not allowed`));
        },
    }),
);
app.use(express.json({ limit: '64kb' }));

/* ------------------------------------------------------- rate limiting --- */

/**
 * In-memory per-IP token buckets. Deliberately simple: this endpoint is backed
 * by an API key, and before this existed anyone could drain it. A restart clears
 * the counters, which is acceptable for a portfolio site.
 */
const buckets = new Map();

function rateLimit(req, res, next) {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(ip) ?? { minute: [], day: [] };

    bucket.minute = bucket.minute.filter((t) => now - t < 60_000);
    bucket.day = bucket.day.filter((t) => now - t < 86_400_000);

    if (bucket.minute.length >= RATE_PER_MINUTE) {
        return res.status(429).json({ error: 'Slow down a moment — too many messages.' });
    }
    if (bucket.day.length >= RATE_PER_DAY) {
        return res.status(429).json({ error: 'Daily message limit reached. Try again tomorrow.' });
    }

    bucket.minute.push(now);
    bucket.day.push(now);
    buckets.set(ip, bucket);

    // Bound memory on a long-lived instance.
    if (buckets.size > 5000) {
        for (const [k, v] of buckets) {
            if (v.day.length === 0) buckets.delete(k);
        }
    }
    next();
}

/* -------------------------------------------------------------- routes --- */

app.get('/', (_req, res) => {
    const index = loadIndex({ quiet: true });
    res.json({
        status: 'ok',
        agent: 'portfolio-rag-agent',
        retrieval: index?.vectorsUsable ? 'vector' : index ? 'lexical (index model mismatch)' : 'lexical (no index)',
        chunks: index?.chunks.length ?? 0,
        indexBuiltAt: index?.builtAt ?? null,
    });
});

app.post('/api/chat', rateLimit, async (req, res) => {
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
    const tooLong = messages.some(
        (m) => typeof m?.content === 'string' && m.content.length > MAX_MESSAGE_CHARS,
    );
    if (tooLong) {
        return res.status(400).json({ error: `Messages must be under ${MAX_MESSAGE_CHARS} characters` });
    }

    try {
        const result = await answer(messages);
        return res.json(result);
    } catch (err) {
        console.error('[chat]', err.message);
        // A 429 here means EVERY model in the fallback chain was rate-limited. On
        // free tiers that is almost always the providers' shared pools being busy
        // rather than this key being out of quota, so say "busy", not "out of quota".
        if (err.status === 429) {
            return res.status(503).json({
                error: "the free model pools are all busy right now — give it a minute and ask again",
            });
        }
        return res.status(502).json({ error: 'The agent had trouble answering. Try again in a moment.' });
    }
});

// CORS rejections arrive here as errors; return a clean 403 rather than a stack trace.
app.use((err, _req, res, _next) => {
    if (err?.message?.includes('not allowed')) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }
    console.error('[server]', err?.message);
    return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    const index = loadIndex();
    console.log(`Portfolio Agent Server on :${PORT}`);
    console.log(`  retrieval: ${index?.vectorsUsable ? 'vector' : 'lexical fallback'}`);
    console.log(`  origins:   ${origins ? origins.join(', ') : 'ALL (ALLOWED_ORIGINS unset)'}`);
});
