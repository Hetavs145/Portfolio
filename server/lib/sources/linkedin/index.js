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
            posts: fresh.posts ?? previous?.posts ?? [],
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

export function linkedinChunks() {
    const snap = readSnapshot();
    if (!snap) return [];

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
    for (const [i, post] of (snap.posts || []).entries()) {
        const text = clean(post.text || '');
        // Skip bare reshares with no commentary of his own — "Congratulations
        // Hetav Shah" is someone else's text and adds nothing to the corpus.
        if (text.length < 60) continue;
        const when = post.postedAt ? ` Posted ${formatWhen(post.postedAt)}.` : '';
        const link = post.url ? ` ${post.url}` : '';
        chunks.push(
            ...splitLong('linkedin', `LinkedIn post ${i + 1}`, `${text}${when}${link}`),
        );
    }

    return chunks;
}
