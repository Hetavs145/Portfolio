/**
 * Portfolio RAG agent — Express server (this is what Render runs).
 *
 * All the actual logic lives in ./lib and is shared with api/chat.js, so the two
 * entry points can no longer drift apart the way the old duplicated files did.
 */

import express from 'express';
import cors from 'cors';

import { respondChat, respondFit } from './lib/respond.js';
import { MIN_JD_CHARS, MAX_JD_CHARS } from './lib/fit.js';
import { validateLead, deliverLead } from './lib/leads.js';
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
function limiter(perMinute, perDay) {
    const buckets = new Map();
    return function rateLimit(req, res, next) {
        const ip = req.ip || 'unknown';
        const now = Date.now();
        const bucket = buckets.get(ip) ?? { minute: [], day: [] };

        bucket.minute = bucket.minute.filter((t) => now - t < 60_000);
        bucket.day = bucket.day.filter((t) => now - t < 86_400_000);

        if (bucket.minute.length >= perMinute) {
            return res.status(429).json({ error: 'Slow down a moment — too many messages.' });
        }
        if (bucket.day.length >= perDay) {
            return res.status(429).json({ error: 'Daily limit reached. Try again tomorrow.' });
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
    };
}

const rateLimit = limiter(RATE_PER_MINUTE, RATE_PER_DAY);
const fitLimit = limiter(3, 15);   // each fit check is one larger model call
const leadLimit = limiter(2, 5);   // a person leaves their email once, not fifty times

/* -------------------------------------------------------------- routes --- */

app.get('/', (_req, res) => {
    const index = loadIndex({ quiet: true });
    res.json({
        status: 'ok',
        agent: 'portfolio-rag-agent',
        provider: process.env.NVIDIA_API_KEY ? 'nvidia-nim' : 'openrouter',
        backupProvider: process.env.NVIDIA_API_KEY && process.env.OPENROUTER_API_KEY ? 'openrouter' : null,
        retrieval: index?.vectorsUsable ? 'vector' : index ? 'lexical (index model mismatch)' : 'lexical (no index)',
        chunks: index?.chunks.length ?? 0,
        indexBuiltAt: index?.builtAt ?? null,
    });
});

app.post('/api/chat', rateLimit, async (req, res) => {
    if (!process.env.NVIDIA_API_KEY && !process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'NVIDIA_API_KEY or OPENROUTER_API_KEY not configured' });
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

    // JSON by default; Server-Sent Events when the client asks for a stream.
    return respondChat(req, res, messages);
});

// Recruiter mode: job description -> honest fit summary (JSON or SSE).
app.post('/api/fit', fitLimit, (req, res) => {
    if (!process.env.NVIDIA_API_KEY && !process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'NVIDIA_API_KEY or OPENROUTER_API_KEY not configured' });
    }
    const jd = typeof req.body?.jd === 'string' ? req.body.jd.trim() : '';
    if (jd.length < MIN_JD_CHARS) {
        return res.status(400).json({ error: 'Paste the full job description (a few lines at least).' });
    }
    if (jd.length > MAX_JD_CHARS) {
        return res.status(400).json({ error: `Job description must be under ${MAX_JD_CHARS} characters.` });
    }
    return respondFit(req, res, jd);
});

// Recruiter mode: "leave your email" -> your Hermes webhook (and/or Telegram).
app.post('/api/lead', leadLimit, async (req, res) => {
    const check = validateLead(req.body);
    if (!check.ok) return res.status(400).json({ error: check.error });
    const delivered = await deliverLead(check.lead);
    if (!delivered) {
        return res.status(503).json({
            error: "Couldn't send that right now — please email hetavs145@gmail.com directly.",
        });
    }
    return res.json({ ok: true });
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
