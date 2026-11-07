/**
 * Vercel adapter for recruiter mode (fit summary). Logic lives in server/lib;
 * production runs the Express server on Render — see server/index.js.
 */

import { respondFit } from '../server/lib/respond.js';
import { MIN_JD_CHARS, MAX_JD_CHARS } from '../server/lib/fit.js';
import { allowedOrigins } from '../server/lib/config.js';

export default async function handler(req, res) {
    const origins = allowedOrigins();
    const origin = req.headers.origin;
    if (!origins) res.setHeader('Access-Control-Allow-Origin', '*');
    else if (origin && origins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    } else if (origin) return res.status(403).json({ error: 'Origin not allowed' });
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const jd = typeof req.body?.jd === 'string' ? req.body.jd.trim() : '';
    if (jd.length < MIN_JD_CHARS) return res.status(400).json({ error: 'Paste the full job description (a few lines at least).' });
    if (jd.length > MAX_JD_CHARS) return res.status(400).json({ error: `Job description must be under ${MAX_JD_CHARS} characters.` });
    return respondFit(req, res, jd);
}
