/**
 * Outbound notifications to you — leads from recruiter mode and questions the
 * bot couldn't answer.
 *
 * Set NOTIFY_WEBHOOK_URL to any HTTPS endpoint that accepts a JSON POST. The
 * intended receiver is your Hermes agent (or anything in front of it), which can
 * forward to Telegram/WhatsApp and remember the lead.
 *
 * NOTIFY_WEBHOOK_SECRET signs every request the way Hermes' webhook adapter
 * verifies it ("Generic V2"): X-Webhook-Timestamp is Unix seconds and
 * X-Webhook-Signature-V2 is the hex HMAC-SHA256 of `<timestamp>.<body>`. Any
 * other receiver can check the same two headers. Point it at a Hermes route:
 *   NOTIFY_WEBHOOK_URL=https://<your-host>/webhooks/portfolio
 * and use {text} (or {name}, {email}, {question}) in that route's prompt.
 *
 * Optional direct fallback, no agent needed: TELEGRAM_BOT_TOKEN +
 * TELEGRAM_CHAT_ID sends the same event as a Telegram message.
 *
 * The public site never talks to Hermes directly — only this server does, and
 * only with these fixed event shapes. Visitors can't make your agent do anything.
 */

import crypto from 'node:crypto';

const TIMEOUT_MS = 8_000;

/** Hermes "Generic V2" signature headers for a raw body. */
function signatureHeaders(raw, secret) {
    if (!secret) return {};
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = crypto.createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex');
    return { 'X-Webhook-Timestamp': ts, 'X-Webhook-Signature-V2': sig };
}

async function post(url, body, { secret } = {}) {
    const raw = JSON.stringify(body);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...signatureHeaders(raw, secret) },
            body: raw,
            signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } finally {
        clearTimeout(timer);
    }
}

/** Human-readable one-liner for chat apps. */
function summarise(event) {
    if (event.type === 'lead') {
        return [
            '📬 New lead from your portfolio',
            `${event.name || 'Someone'} <${event.email}>${event.company ? ` · ${event.company}` : ''}`,
            event.message ? `“${event.message}”` : null,
            event.fit ? `Fit summary: ${event.fit.slice(0, 600)}` : null,
        ]
            .filter(Boolean)
            .join('\n');
    }
    if (event.type === 'miss') return `❓ Your bot couldn't answer: “${event.question}”`;
    return JSON.stringify(event);
}

/** @returns {Promise<boolean>} true if at least one channel accepted it */
export async function notify(event) {
    const tasks = [];

    const url = process.env.NOTIFY_WEBHOOK_URL;
    if (url) {
        tasks.push(
            post(url, { ...event, text: summarise(event), source: 'portfolio' }, { secret: process.env.NOTIFY_WEBHOOK_SECRET }),
        );
    }

    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChat) {
        tasks.push(
            post(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                chat_id: tgChat,
                text: summarise(event),
                disable_web_page_preview: true,
            }),
        );
    }

    if (!tasks.length) {
        console.warn(`[notify] no NOTIFY_WEBHOOK_URL or Telegram configured — ${event.type} not delivered`);
        return false;
    }
    const results = await Promise.allSettled(tasks);
    for (const r of results) if (r.status === 'rejected') console.warn('[notify]', r.reason?.message);
    return results.some((r) => r.status === 'fulfilled');
}
