/**
 * Live portfolio website -> chunks.
 *
 * The sibling `site.js` source imports the same data modules the React app
 * renders from, which is exact but only covers what lives in those modules.
 * Plenty of the page does not: About and Experience carry their copy inline in
 * JSX, so the bot had never read Hetav's own About text or his experience
 * timeline, and answered questions about them with "not sure".
 *
 * This source renders the deployed site in a real browser and reads what a
 * visitor actually sees. Anything on the page is therefore answerable, wherever
 * it lives in the codebase.
 *
 * Failure is non-fatal, matching the other live sources: a build with no network,
 * no browser binary, or a site that is down falls back to the last good snapshot
 * and reports itself stale (so `build-index.js --strict` fails the nightly run
 * rather than quietly shipping a thinner knowledge base).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitLong } from '../chunk.js';
import { reportSource } from '../freshness.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = path.join(HERE, '..', '..', 'data', 'website.json');

export const siteUrl = () => process.env.SITE_URL || 'https://portfolio.vaquah.in';

/** Sections whose text is the agent's own chat UI, not content about Hetav. */
const SKIP_SECTIONS = /^(agent|chat|contact-form)$/i;

/** Boilerplate that would otherwise be indexed as if it were a fact. */
const NOISE = [
    /^ask about hetav/i,
    /^refresh$/i,
    /^history$/i,
    /^send$/i,
    /^scroll/i,
    /^loading/i,
    /^\W*$/,
];

const isNoise = (text) => NOISE.some((re) => re.test(text.trim()));

function readSnapshot() {
    try {
        return JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
    } catch {
        return null;
    }
}

/**
 * Render the site and extract one text block per section.
 * Returns { url, fetchedAt, sections: [{ id, heading, text }] }.
 */
export async function crawlWebsite({ timeoutMs = 60_000 } = {}) {
    // Imported lazily: playwright is a devDependency, and a production server
    // that never crawls should not fail to boot because it is absent.
    const { chromium } = await import('playwright');

    const browser = await chromium.launch();
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await page.goto(siteUrl(), { waitUntil: 'networkidle', timeout: timeoutMs });

        // The page animates in on scroll, so sections below the fold render empty
        // until they enter the viewport. Walk to the bottom before reading.
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let y = 0;
                const step = () => {
                    window.scrollTo(0, y);
                    y += window.innerHeight / 2;
                    if (y < document.body.scrollHeight) setTimeout(step, 120);
                    else setTimeout(resolve, 600);
                };
                step();
            });
        });

        const sections = await page.evaluate(() => {
            const clean = (s) => s.replace(/\s+/g, ' ').trim();
            const nodes = [...document.querySelectorAll('section[id], section, main > div[id]')];

            return nodes
                .map((el) => ({
                    id: el.id || '',
                    heading: clean(el.querySelector('h1, h2, h3')?.innerText ?? ''),
                    text: clean(el.innerText ?? ''),
                }))
                .filter((s) => s.text.length > 40);
        });

        return { url: siteUrl(), fetchedAt: new Date().toISOString(), sections };
    } finally {
        await browser.close();
    }
}

/** Crawl, persist on success, fall back to the previous snapshot on failure. */
export async function refreshWebsite(opts = {}) {
    const previous = readSnapshot();
    try {
        const data = await crawlWebsite(opts);
        if (!data.sections.length) throw new Error('rendered page produced no sections');
        fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
        fs.writeFileSync(SNAPSHOT, JSON.stringify(data, null, 2) + '\n');
        return { data, refreshed: true, reason: `crawled ${data.sections.length} sections` };
    } catch (err) {
        console.warn(`[website] crawl failed: ${err.message}`);
        if (previous) console.warn('[website] keeping last good snapshot');
        return { data: previous, refreshed: false, reason: err.message };
    }
}

/** Snapshot older than this and the build is marked degraded. */
const MAX_SNAPSHOT_AGE_DAYS = 30;

export function websiteChunks() {
    const snap = readSnapshot();
    if (!snap?.sections?.length) {
        reportSource('website', { fresh: false, reason: 'no crawl snapshot on disk' });
        return [];
    }

    const asOf = (snap.fetchedAt || '').slice(0, 10);
    const ageDays = asOf ? Math.floor((Date.now() - Date.parse(asOf)) / 86_400_000) : Infinity;
    reportSource(
        'website',
        ageDays > MAX_SNAPSHOT_AGE_DAYS
            ? { fresh: false, asOf, reason: `crawl snapshot ${ageDays} days old` }
            : { fresh: true, asOf },
    );

    const chunks = [];
    const seen = new Set();

    for (const section of snap.sections) {
        if (SKIP_SECTIONS.test(section.id)) continue;
        if (isNoise(section.text)) continue;

        // Nested sections repeat their parent's text; keep the first occurrence.
        const key = section.text.slice(0, 120);
        if (seen.has(key)) continue;
        seen.add(key);

        const label = section.heading || section.id || 'page';
        chunks.push(
            ...splitLong(
                'website',
                `Website — ${label}`,
                `From Hetav's portfolio site (${snap.url}), the "${label}" section: ${section.text}`,
                { date: asOf, kind: 'page', url: snap.url },
            ),
        );
    }

    return chunks;
}
