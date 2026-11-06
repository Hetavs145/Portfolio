/**
 * Sends one real test notification to your Telegram, so you can confirm the bot
 * is wired up before a recruiter ever uses it.
 *
 *   npm run notify:test
 *
 * Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from .env.
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
    console.log('Delivered. Check your Telegram.');
} else {
    console.error('Not delivered — see the [notify] warning above. Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, and that you have messaged the bot once.');
    process.exit(1);
}
