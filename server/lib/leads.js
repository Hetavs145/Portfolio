/**
 * Recruiter-mode lead capture: validate, then send it to Hetav on Telegram
 * (lib/notify.js). Nothing is stored on the server — Render's disk is
 * ephemeral — so delivery is the whole job, and the visitor is told plainly if
 * it didn't go through.
 */

import { notify } from './notify.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

/** @returns {{ok: true, lead: object} | {ok: false, error: string}} */
export function validateLead(body) {
    // Honeypot: a field humans never see. Bots fill it; pretend success.
    if (clip(body?.website, 200)) return { ok: true, lead: null };

    const lead = {
        name: clip(body?.name, 120),
        email: clip(body?.email, 200),
        company: clip(body?.company, 160),
        message: clip(body?.message, 1500),
        fit: clip(body?.fit, 3000),
    };
    if (!EMAIL.test(lead.email)) return { ok: false, error: 'Please enter a valid email address.' };
    if (!lead.name) return { ok: false, error: 'Please add your name.' };
    return { ok: true, lead };
}

/** @returns {Promise<boolean>} delivered */
export async function deliverLead(lead, meta = {}) {
    if (!lead) return true; // honeypot hit
    return notify({ type: 'lead', ...lead, at: new Date().toISOString(), ...meta });
}
