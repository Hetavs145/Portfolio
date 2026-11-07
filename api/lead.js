/**
 * Vercel adapter for recruiter-mode lead capture. Logic lives in server/lib;
 * production runs the Express server on Render — see server/index.js.
 */

import { validateLead, deliverLead } from '../server/lib/leads.js';
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

    const check = validateLead(req.body);
    if (!check.ok) return res.status(400).json({ error: check.error });
    const delivered = await deliverLead(check.lead);
    if (!delivered) {
        return res.status(503).json({ error: "Couldn't send that right now — please email hetavs145@gmail.com directly." });
    }
    return res.json({ ok: true });
}
