/**
 * LinkedIn source — adapter selection, failure cascade, and chunking.
 *
 * LINKEDIN_SOURCE picks the live adapter: 'rapidapi' (default) | 'dma' | 'export' | 'off'.
 *
 * The cascade never hard-fails. If the live adapter errors or the monthly credit
 * budget is spent, we keep the last good server/data/linkedin.json and log a
 * warning. The bot then answers from yesterday's data instead of going blind.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeChunk, splitLong } from '../../chunk.js';
import { reportSource } from '../../freshness.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SNAPSHOT = path.join(HERE, '..', '..', '..', 'data', 'linkedin.json');

export function readSnapshot() {
    if (!fs.existsSync(SNAPSHOT)) return null;
    try {
        return JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
    } catch {
        console.warn('[linkedin] snapshot is corrupt; ignoring');
        return null;
    }
}

function writeSnapshot(data) {
    fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
    fs.writeFileSync(SNAPSHOT, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Refresh the snapshot. Returns { data, refreshed, reason }.
 * `refreshed: false` means the previous snapshot was preserved.
 */
export async function refreshLinkedIn(opts = {}) {
    const mode = (process.env.LINKEDIN_SOURCE || 'rapidapi').toLowerCase();
    const previous = readSnapshot();

    if (mode === 'off') {
        return { data: previous, refreshed: false, reason: 'LINKEDIN_SOURCE=off' };
    }

    try {
        const adapter =
            mode === 'dma'
                ? await import('./dma.js')
                : mode === 'export'
                  ? await import('./export.js')
                  : await import('./rapidapi.js');

        const fresh = await adapter.fetchLinkedIn(opts);

        // A daily posts-only run must not wipe the weekly profile block.
        const merged = {
            ...previous,
            ...fresh,
            profile: fresh.profile ?? previous?.profile ?? null,
            posts: mergePosts(previous?.posts, fresh.posts),
        };

        writeSnapshot(merged);
        return { data: merged, refreshed: true, reason: `via ${mode}` };
    } catch (err) {
        console.warn(`[linkedin] refresh failed (${mode}): ${err.message}`);
        if (previous) {
            console.warn('[linkedin] keeping last good snapshot — knowledge base not degraded');
        }
        return { data: previous, refreshed: false, reason: err.message };
    }
}

/**
 * Identity for a post. The permalink is unique and stable; posts that arrive
 * without one fall back to their timestamp plus a prefix of their text.
 */
function postKey(post) {
    if (post?.url) return `url:${post.url}`;
    return `txt:${(post?.postedAt ?? '').slice(0, 10)}:${(post?.text ?? '').replace(/\s+/g, ' ').slice(0, 80)}`;
}

/**
 * Union the archive with a fresh page, newest first.
 *
 * This used to be a straight replace: `posts: fresh.posts ?? previous.posts`.
 * The API returns only the most recent page, so every nightly run threw away
 * everything older than that page — the archive could never hold more than one
 * page's worth, and posts silently fell off the back as new ones were published.
 * That is why the knowledge base had a 19-month hole in it and the bot denied
 * posts that genuinely exist.
 *
 * Merging instead means the archive only ever grows: each run contributes
 * whatever it can see, and history already collected is never lost — even if a
 * later scrape fails or returns fewer posts.
 */
export function mergePosts(previous, fresh) {
    if (!fresh) return previous ?? [];

    const byKey = new Map();
    // Previous first, then fresh, so a re-scraped post overwrites the old copy
    // (edited text, updated reaction counts) rather than duplicating it.
    for (const post of previous ?? []) byKey.set(postKey(post), post);
    for (const post of fresh) byKey.set(postKey(post), post);

    return [...byKey.values()].sort((a, b) =>
        String(b.postedAt ?? '').localeCompare(String(a.postedAt ?? '')),
    );
}

/* ------------------------------------------------------------- chunking --- */

/**
 * LinkedIn text needs cleaning before it can be embedded usefully:
 *
 *  - Posts are full of "𝗺𝗮𝘁𝗵𝗲𝗺𝗮𝘁𝗶𝗰𝗮𝗹 𝗯𝗼𝗹𝗱" characters, which people use for
 *    fake bold. They are distinct codepoints from ASCII, so an embedding model
 *    sees them as unrelated tokens and a query for "MBA" never matches "𝗠𝗕𝗔".
 *    NFKC normalisation folds them back to plain letters.
 *  - The API returns raw HTML entities (&nbsp;, &amp;) in profile fields.
 */
const ENTITIES = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
};

function clean(text) {
    if (typeof text !== 'string') return text;
    return text
        .normalize('NFKC')
        .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, (m) => ENTITIES[m])
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/[​-‏﻿]/g, '') // zero-width junk
        .replace(/\s+/g, ' ')
        .trim();
}

/** Records arrive shaped differently per adapter; render whatever fields exist. */
function describeRecord(rec) {
    if (typeof rec === 'string') return clean(rec);
    if (!rec || typeof rec !== 'object') return '';

    const pick = (...keys) => keys.map((k) => rec[k]).find((v) => v != null && v !== '');

    const name = pick('name', 'Name', 'title', 'Title', 'companyName', 'Company Name', 'schoolName', 'School Name');
    const org = pick('authority', 'Authority', 'company', 'Company', 'companyName', 'issuer', 'Issuer');
    const when = pick('date', 'Date', 'start', 'Started On', 'startDate', 'timePeriod', 'Finished On', 'end');
    const detail = pick('description', 'Description', 'degree', 'Degree Name', 'fieldOfStudy', 'Field Of Study');

    return clean(
        [name, org, formatWhen(when), detail]
            .filter(Boolean)
            .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
            .join(' · '),
    );
}

const MONTHS = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Dates arrive as {year, month, day} objects (day/month are 0 when unknown), or
 * as Go-style timestamps like "2026-07-26 13:48:52.553 +0000 UTC". Rendering the
 * raw object as JSON put `{"year":2026,"month":9,"day":0}` into the embedded text.
 */
function formatWhen(when) {
    if (!when) return '';
    if (typeof when === 'string') {
        const iso = /^(\d{4}-\d{2}-\d{2})/.exec(when);
        return iso ? iso[1] : when;
    }
    if (typeof when === 'object') {
        // A nested {start, end} range.
        if (when.start || when.end) {
            const a = formatWhen(when.start);
            const b = formatWhen(when.end);
            return [a, b].filter(Boolean).join(' to ') || '';
        }
        const { year, month } = when;
        if (!year) return '';
        return month ? `${MONTHS[month] ?? ''} ${year}`.trim() : String(year);
    }
    return String(when);
}

function listChunks(source, label, records, limit = 30) {
    const lines = (records || []).slice(0, limit).map(describeRecord).filter(Boolean);
    if (lines.length === 0) return [];
    return splitLong(source, label, lines.join('. '));
}

/**
 * How old a snapshot may get before the build calls it stale. The data is still
 * used — blanking LinkedIn outright would trade a staleness bug for an amnesia
 * bug, which is worse — but the run is marked degraded, so `--strict` fails it
 * and the nightly job goes red instead of quietly shipping month-old text.
 */
const MAX_SNAPSHOT_AGE_DAYS = 30;

export function linkedinChunks() {
    const snap = readSnapshot();
    if (!snap) {
        reportSource('linkedin', { fresh: false, reason: 'no snapshot on disk' });
        return [];
    }

    const asOf = (snap.fetchedAt || '').slice(0, 10);
    const ageDays = asOf
        ? Math.floor((Date.now() - Date.parse(asOf)) / 86400_000)
        : Number.POSITIVE_INFINITY;

    if (ageDays > MAX_SNAPSHOT_AGE_DAYS) {
        console.warn(
            `[linkedin] snapshot is ${Number.isFinite(ageDays) ? `${ageDays} days` : 'of unknown age'} old ` +
                `(> ${MAX_SNAPSHOT_AGE_DAYS}) — using it, but marking this build stale`,
        );
        reportSource('linkedin', {
            fresh: false,
            asOf,
            reason: `snapshot ${Number.isFinite(ageDays) ? `${ageDays} days` : 'of unknown age'} old`,
        });
    } else {
        reportSource('linkedin', { fresh: true, asOf });
    }

    const chunks = [];
    const p = snap.profile || {};
    const stamp = snap.fetchedAt ? ` (LinkedIn data as of ${snap.fetchedAt.slice(0, 10)})` : '';

    if (p.headline || p.summary) {
        chunks.push(
            ...splitLong(
                'linkedin',
                'LinkedIn headline and about',
                [p.headline, p.summary, p.location].filter(Boolean).map(clean).join('. ') + stamp,
            ),
        );
    }

    chunks.push(...listChunks('linkedin', 'LinkedIn — certifications and licenses', p.certifications));
    chunks.push(...listChunks('linkedin', 'LinkedIn — experience', p.positions));
    chunks.push(...listChunks('linkedin', 'LinkedIn — education', p.education));
    chunks.push(...listChunks('linkedin', 'LinkedIn — honors and awards', p.honors));
    chunks.push(...listChunks('linkedin', 'LinkedIn — projects', p.projects));

    if (p.skills?.length) {
        const names = p.skills
            .map((s) => (typeof s === 'string' ? clean(s) : describeRecord(s)))
            .filter(Boolean);
        if (names.length) {
            chunks.push(
                makeChunk('linkedin', 'LinkedIn — skills', `Skills listed on LinkedIn: ${names.join(', ')}.`),
            );
        }
    }

    // Posts are chunked individually — they're the thing most likely to be asked
    // about specifically ("what did he post about X"), so precision matters.
    //
    // Every post chunk is dated twice over: as `date` metadata (which drives the
    // recency ranking) and as a prefix on the text of *every* fragment (so a model
    // reading one split piece can never be tempted to invent a date). The title
    // carries the date too, since titles are embedded alongside the body.
    const posts = (snap.posts || [])
        .map((post) => ({
            text: clean(post.text || ''),
            date: isoDate(post.postedAt),
            url: post.url || '',
        }))
        // Keep every post, including short ones.
        //
        // These used to be dropped as "bare reshares with no commentary". That
        // filter silently deleted real posts: the 2026-03-27 certificate post for
        // the Aetrix hackathon win carries only LinkedIn's template line
        // ("Congratulations Hetav Shah"), so it fell under the threshold and the
        // bot flatly denied that the post existed. A short post is still a post,
        // and its date and link are exactly what someone asking about it wants.
        .filter((p) => p.text || p.url)
        // Newest first, so ordinals in the corpus ("most recent", "2nd most
        // recent") are true regardless of what order the API returned.
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Several posts can share a date (three went out on 2025-11-11). Titles key
    // the chunk id AND the recency layer's notion of "one item", so same-day
    // posts must not collapse into one — otherwise pinning "the latest post"
    // could splice fragments of two different posts together.
    const perDate = new Map();
    for (const p of posts) perDate.set(p.date, (perDate.get(p.date) ?? 0) + 1);
    const seenPerDate = new Map();

    for (const [i, post] of posts.entries()) {
        const n = (seenPerDate.get(post.date) ?? 0) + 1;
        seenPerDate.set(post.date, n);
        const suffix = (perDate.get(post.date) ?? 0) > 1 ? ` #${n}` : '';
        const rank =
            i === 0
                ? 'This is his MOST RECENT LinkedIn post.'
                : `This is his ${ordinal(i + 1)} most recent LinkedIn post.`;
        const stampPrefix = post.date ? `Posted ${post.date}. ${rank} ` : '';
        const link = post.url ? ` Link: ${post.url}` : '';
        // A short post is usually an image, certificate or celebration card whose
        // only text is a template line. Saying so keeps the model from reading the
        // thin text as the whole story, and keeps the post findable by date.
        const note =
            post.text.length < 60
                ? ' (This is a short post — an image, certificate or shared celebration card ' +
                  'rather than a written update, so the post text itself is brief.)'
                : '';

        chunks.push(
            ...splitLong(
                'linkedin',
                `LinkedIn post — ${post.date || 'undated'}${suffix}`,
                `${stampPrefix}${post.text}${note}${link}`,
                { date: post.date, kind: 'post', url: post.url },
            ),
        );
    }

    // Deterministic timeline chunks. Cosine similarity cannot rank by date, so
    // "what did you post most recently?" needs a chunk that already contains the
    // answer in sorted form, rather than 23 post chunks that each look equally
    // plausible to an embedding.
    //
    // These are emitted in fixed-size pages rather than as one long block on
    // purpose: a single block would exceed MAX_CHARS and be split into fragments,
    // and a fragment of a timeline is worse than useless — it looks authoritative
    // while missing most of the list. Paging also makes "first ever post" work,
    // because the oldest page sorts to the front when the question asks for it.
    // Counting questions ("how many posts do you have?") cannot be answered from
    // retrieved excerpts — the model counts the blocks in front of it and says
    // "four". One chunk holding the actual totals fixes that.
    if (posts.length) {
        const years = [...new Set(posts.map((p) => (p.date || '').slice(0, 4)).filter(Boolean))];
        chunks.push(
            makeChunk(
                'linkedin',
                'LinkedIn posting activity — totals',
                `Hetav has ${posts.length} LinkedIn posts in his knowledge base, ` +
                    `published between ${posts[posts.length - 1].date || 'an unknown date'} and ` +
                    `${posts[0].date || 'an unknown date'}, spanning ${years.length} year(s): ` +
                    `${years.sort().join(', ')}. That is the complete set his agent can see; ` +
                    `it reflects what the LinkedIn API returns, so very old posts may not appear.`,
                // Deliberately NOT kind 'timeline': timelines are excluded from
                // similarity search (they match everything), and this chunk has
                // to be findable by an ordinary question like "how many posts?".
                { date: posts[0].date, kind: 'stats' },
            ),
        );
    }

    const PAGE = 8;
    for (let start = 0; start < posts.length; start += PAGE) {
        const page = posts.slice(start, start + PAGE);
        const isFirst = start === 0;
        const isLast = start + PAGE >= posts.length;

        const heading = isFirst
            ? `Hetav's most recent LinkedIn posts, newest first. His latest post is the first entry, posted ${posts[0].date || 'on an unknown date'}.`
            : `Hetav's LinkedIn posts ${start + 1}-${Math.min(start + PAGE, posts.length)} of ${posts.length}, newest first.`;
        const tail = isLast
            ? ` The last entry is the oldest post he has, from ${posts[posts.length - 1].date || 'an unknown date'}.`
            : '';

        const lines = page.map(
            (p, i) => `${start + i + 1}. ${p.date || 'undated'} — ${summarise(p.text, 60)}`,
        );

        chunks.push(
            makeChunk(
                'linkedin',
                isFirst
                    ? 'LinkedIn posts — timeline, newest first'
                    : `LinkedIn posts — timeline ${start + 1}-${Math.min(start + PAGE, posts.length)}`,
                `${heading} ${lines.join(' ')}${tail}`,
                { date: page[0].date, kind: 'timeline' },
            ),
        );
    }

    return chunks;
}

/** "2026-07-26 13:48:52.553 +0000 UTC" or {year, month, day} -> "2026-07-26". */
function isoDate(when) {
    if (!when) return null;
    if (typeof when === 'string') {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(when.trim());
        return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
    }
    if (typeof when === 'object' && when.year) {
        const pad = (n) => String(n).padStart(2, '0');
        return `${when.year}-${pad(when.month || 1)}-${pad(when.day || 1)}`;
    }
    return null;
}

const ORDINALS = [
    '', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th',
];
const ordinal = (n) => ORDINALS[n] || `${n}th`;

/** First sentence-ish of a post, for the timeline listing. */
function summarise(text, max = 110) {
    const flat = text.replace(/\s+/g, ' ').trim();
    if (flat.length <= max) return flat;
    return flat.slice(0, max).replace(/\s+\S*$/, '') + '…';
}
