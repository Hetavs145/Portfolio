/**
 * Sends one real test notification through the configured channels, so you can
 * confirm Hermes (and/or Telegram) is wired up before a recruiter ever uses it.
 *
 *   npm run notify:test
 *
 * Reads NOTIFY_WEBHOOK_URL / NOTIFY_WEBHOOK_SECRET (and optional
 * TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID) from .env.
 */

import { notify } from '../lib/notify.js';

const delivered = await notify({
    type: 'lead',
    name: 'Portfolio test',
    email: 'test@example.com',
    company: 'Setup check',
    message: 'If you can read this, recruiter-mode notifications reach you.',
    at: new Date().toISOString(),
});

if (delivered) {
    console.log('Delivered. Check Telegram (or wherever your Hermes route delivers).');
} else {
    console.error('Not delivered — see the [notify] warning above. Check the URL, secret and that Hermes is reachable.');
    process.exit(1);
}
