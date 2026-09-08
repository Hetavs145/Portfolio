/**
 * Refreshes server/data/linkedin.json from the configured adapter.
 *
 *   npm run refresh:linkedin              # profile + posts
 *   npm run refresh:linkedin -- --posts   # posts only   (1 credit — the daily job)
 *   npm run refresh:linkedin -- --profile # profile only (1 credit — the weekly job)
 *
 * Credit budget on the RapidAPI free tier (50/month):
 *   posts daily (~30) + profile weekly (~5) = ~35, leaving headroom for retries.
 *
 * Exits 0 even when the refresh fails: the cascade keeps the last good snapshot,
 * and a scraper outage must not fail the whole knowledge-base rebuild.
 */

import { refreshLinkedIn, readSnapshot } from '../lib/sources/linkedin/index.js';

const args = process.argv.slice(2);
const postsOnly = args.includes('--posts');
const profileOnly = args.includes('--profile');

const opts = {
    includeProfile: !postsOnly,
    includePosts: !profileOnly,
};

const before = readSnapshot();

const { data, refreshed, reason } = await refreshLinkedIn(opts);

if (refreshed) {
    const certs = data?.profile?.certifications?.length ?? 0;
    const posts = data?.posts?.length ?? 0;
    console.log(`LinkedIn refreshed ${reason}`);
    console.log(`  certifications: ${certs}`);
    console.log(`  positions:      ${data?.profile?.positions?.length ?? 0}`);
    console.log(`  posts:          ${posts}`);
} else if (data) {
    const age = before?.fetchedAt ? ` (from ${before.fetchedAt.slice(0, 10)})` : '';
    console.warn(`LinkedIn NOT refreshed: ${reason}`);
    console.warn(`Keeping last good snapshot${age} — knowledge base not degraded.`);
} else {
    console.warn(`LinkedIn NOT refreshed and no previous snapshot exists: ${reason}`);
    console.warn('The bot will simply have no LinkedIn data; every other source is unaffected.');
}
