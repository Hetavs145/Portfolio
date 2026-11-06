/**
 * Learn from misses: questions the bot couldn't answer are reported so they can
 * be answered once and folded back into the knowledge base.
 *
 * A miss is a reply whose trailer said [[unanswered]] (see lib/citations.js).
 * Each one is sent, fire-and-forget, to whichever of these is configured:
 *
 *   NOTIFY_WEBHOOK_URL   your Hermes webhook route (signed; see lib/notify.js),
 *                        and/or TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID directly
 *   GITHUB_ISSUES_TOKEN  fine-grained token with Issues: read & write on this repo.
 *   GITHUB_ISSUES_REPO   defaults to Hetavs145/Portfolio
 *                        Opens one issue per distinct question, labelled kb-miss.
 *
 * To teach the bot, reply on the issue with a comment starting "Answer:". The
 * nightly rebuild reads answered kb-miss issues as a knowledge source
 * (lib/sources/faq.js) — no code change, no redeploy by hand.
 */

import { notify } from './notify.js';

const REPO = process.env.GITHUB_ISSUES_REPO || 'Hetavs145/Portfolio';
export const MISS_LABEL = 'kb-miss';

/** In-process dedupe so one curious visitor doesn't open ten issues. */
const reported = new Map();
const DEDUPE_MS = 24 * 3600_000;

const normalise = (q) => q.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Called after every answered turn; acts only on misses. Never throws. */
export function onAnswered(messages, result) {
    if (!result?.unanswered || result.cached) return;
    const question = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim();
    if (!question) return;

    const key = normalise(question);
    const last = reported.get(key);
    if (last && Date.now() - last < DEDUPE_MS) return;
    reported.set(key, Date.now());
    if (reported.size > 500) reported.delete(reported.keys().next().value);

    reportMiss(question, result).catch((err) => console.warn('[misses]', err.message));
}

async function reportMiss(question, result) {
    console.log(`[misses] unanswered: ${question.slice(0, 120)}`);
    await Promise.allSettled([
        notify({ type: 'miss', question, reply: result.message, at: new Date().toISOString() }),
        openIssue(question, result),
    ]);
}

async function openIssue(question, result) {
    const token = process.env.GITHUB_ISSUES_TOKEN;
    if (!token) return;
    const api = `https://api.github.com/repos/${REPO}`;
    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'portfolio-agent',
    };

    // Skip if an open miss with the same question already exists.
    const q = encodeURIComponent(`repo:${REPO} is:issue is:open label:${MISS_LABEL} in:title "${question.slice(0, 80).replace(/"/g, '')}"`);
    const search = await fetch(`https://api.github.com/search/issues?q=${q}`, { headers });
    if (search.ok && (await search.json()).total_count > 0) return;

    const title = `Bot couldn't answer: ${question.length > 90 ? `${question.slice(0, 87)}…` : question}`;
    const body =
        `A visitor asked the portfolio bot:\n\n> ${question.replace(/\n/g, '\n> ')}\n\n` +
        `It replied:\n\n> ${String(result.message || '').replace(/\n/g, '\n> ')}\n\n` +
        `**To teach it:** comment on this issue starting with \`Answer:\` followed by the answer, ` +
        `in first person as you'd say it. The next knowledge-base rebuild picks it up. ` +
        `Close the issue to retire the answer.\n\n_Question as asked:_ \`${question.replace(/`/g, "'")}\``;

    const res = await fetch(`${api}/issues`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, labels: [MISS_LABEL] }),
    });
    if (!res.ok) throw new Error(`GitHub issue create -> HTTP ${res.status}`);
}
