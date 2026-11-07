/**
 * Notifications to Hetav — recruiter-mode leads and questions the bot couldn't
 * answer — sent as Telegram messages from a bot you own. Free, instant, and no
 * agent or extra service in between.
 *
 * Setup (Render dashboard):
 *   TELEGRAM_BOT_TOKEN  from @BotFather (/newbot)
 *   TELEGRAM_CHAT_ID    your chat id — message the bot once, then open
 *                       https://api.telegram.org/bot<token>/getUpdates
 *
 * The public site never sends messages itself: only this server does, with the
 * fixed message shapes below.
 */

const TIMEOUT_MS = 8_000;

/** Human-readable message for each event type. */
function format(event) {
    if (event.type === 'lead') {
        return [
            'New lead from your portfolio',
            `${event.name || 'Someone'} <${event.email}>${event.company ? ` · ${event.company}` : ''}`,
            event.message ? `Message: ${event.message}` : null,
            event.fit ? `Fit summary:\n${event.fit.slice(0, 1500)}` : null,
        ]
            .filter(Boolean)
            .join('\n');
    }
    if (event.type === 'miss') return `Your portfolio bot couldn't answer:\n"${event.question}"`;
    return JSON.stringify(event);
}

/** @returns {Promise<boolean>} true if Telegram accepted the message */
export async function notify(event) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
        console.warn(`[notify] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — ${event.type} not delivered`);
        return false;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: format(event), disable_web_page_preview: true }),
            signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Telegram HTTP ${res.status}`);
        return true;
    } catch (err) {
        console.warn('[notify]', err.message);
        return false;
    } finally {
        clearTimeout(timer);
    }
}
