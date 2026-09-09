/**
 * Crawls the deployed portfolio site into server/data/website.json.
 *
 *   npm run refresh:website
 *
 * Separate from the index build for the same reason the LinkedIn refresh is:
 * it needs a browser and the network, so a failure here should be visible on its
 * own rather than buried inside a rebuild. Exits 0 either way — the cascade keeps
 * the last good snapshot, and `build-index.js --strict` is what turns staleness
 * into a failed run.
 */

import { refreshWebsite, siteUrl } from '../lib/sources/website.js';

console.log(`Crawling ${siteUrl()} ...`);

const { data, refreshed, reason } = await refreshWebsite();

if (refreshed) {
    console.log(`Website refreshed: ${reason}`);
    for (const s of data.sections) {
        console.log(`  ${(s.heading || s.id || '(unnamed)').padEnd(28)} ${s.text.length} chars`);
    }
} else if (data) {
    console.warn(`Website NOT refreshed: ${reason}`);
    console.warn(`Keeping snapshot from ${data.fetchedAt?.slice(0, 10) ?? 'unknown date'}.`);
} else {
    console.warn(`Website NOT refreshed and no previous snapshot: ${reason}`);
    console.warn('The bot simply has no crawled site copy; every other source is unaffected.');
}
