/**
 * RapidAPI `linkedin-api8` adapter (RockApis).
 *
 * Scrapes independently of your account — you send a profile URL, it returns JSON.
 * No li_at cookie is involved, so there is no ban risk to your own LinkedIn.
 *
 * Free tier: 50 credits / 75 requests per month. Budget at 1 credit per call:
 *   posts   daily   ~30/mo
 *   profile weekly   ~5/mo
 *   ------------------------
 *   total           ~35/50, leaving headroom for retries.
 *
 * RAPIDAPI_KEY_FALLBACK can hold a second free key on the sibling host
 * `linkedin-data-api`, which has its own separate 50-credit bucket.
 */

/**
 * Hosts, in priority order. Overridable via RAPIDAPI_HOST / RAPIDAPI_HOST_FALLBACK
 * so a provider migration is a config change rather than a code change — which
 * matters, because this exact thing already happened once: the original
 * `linkedin-api8` host relocated to `professional-network-data` and started
 * returning `success:false` with a "no longer available at this location"
 * message on *every* endpoint, HTTP 200 and all.
 */
/** LinkedIn's own pagination block size; offsets must be multiples of it. */
const PAGE_SIZE = 50;

const HOSTS = {
    primary: process.env.RAPIDAPI_HOST || 'professional-network-data.p.rapidapi.com',
    fallback: process.env.RAPIDAPI_HOST_FALLBACK || 'linkedin-api8.p.rapidapi.com',
};

async function call(host, key, endpoint, params) {
    const url = new URL(`https://${host}${endpoint}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url, {
        headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': key },
    });

    if (res.status === 403) {
        throw new Error(
            `Not subscribed to ${host}. Subscribe (free tier) at ` +
                `https://rapidapi.com/pnd-team-pnd-team/api/professional-network-data`,
        );
    }
    if (res.status === 429) {
        throw new Error(`Rate limited by ${host} (monthly credits spent, or not subscribed)`);
    }
    if (!res.ok) throw new Error(`RapidAPI ${host}${endpoint} -> HTTP ${res.status}`);

    const json = await res.json();
    // Logical failures come back in the body with success:false, not via status.
    if (json.success === false) {
        const msg = json.message || 'success:false';
        if (/no longer available at this location/i.test(msg)) {
            throw new Error(
                `${host} has relocated. Set RAPIDAPI_HOST to the new host and resubscribe. (${msg})`,
            );
        }
        throw new Error(`RapidAPI ${endpoint} -> ${msg}`);
    }
    return json.data ?? json;
}

/**
 * Try the primary key, then the fallback key on the sibling host. Only the
 * caller decides what to do when both fail (answer: keep the last good snapshot).
 */
async function callWithFallback(endpoint, params) {
    const primary = process.env.RAPIDAPI_KEY;
    const fallback = process.env.RAPIDAPI_KEY_FALLBACK;
    if (!primary && !fallback) throw new Error('RAPIDAPI_KEY is not set');

    const attempts = [
        primary && { host: HOSTS.primary, key: primary },
        fallback && { host: HOSTS.fallback, key: fallback },
    ].filter(Boolean);

    let lastErr;
    for (const { host, key } of attempts) {
        try {
            return await call(host, key, endpoint, params);
        } catch (err) {
            lastErr = err;
            console.warn(`[linkedin] ${host} failed: ${err.message}`);
        }
    }
    throw lastErr;
}

const profileUrl = () =>
    process.env.LINKEDIN_PROFILE_URL || 'https://www.linkedin.com/in/hetav-shah-26601722b/';

/**
 * @param {{ includeProfile?: boolean, includePosts?: boolean, pages?: number }} what
 *   Lets the cron pull posts daily but the full profile only weekly, which is
 *   what keeps monthly spend inside the free 50 credits. `pages` > 1 walks back
 *   through post history and costs one extra credit per page — for backfills,
 *   not for the nightly run.
 */
export async function fetchLinkedIn({ includeProfile = true, includePosts = true, pages = 1 } = {}) {
    const url = profileUrl();
    const out = { source: 'rapidapi', profileUrl: url, fetchedAt: new Date().toISOString() };

    if (includeProfile) {
        const p = await callWithFallback('/get-profile-data-by-url', { url });
        out.profile = {
            headline: p.headline ?? null,
            summary: p.summary ?? p.about ?? null,
            location: p.geo?.full ?? p.location ?? null,
            positions: p.position ?? p.positions ?? p.fullPositions ?? [],
            education: p.educations ?? p.education ?? [],
            skills: p.skills ?? [],
            certifications: p.certifications ?? p.certification ?? p.courses ?? [],
            honors: p.honors ?? [],
            projects: p.projects?.items ?? p.projects ?? [],
        };
    }

    if (includePosts) {
        out.posts = await fetchPosts(usernameFrom(url), pages);
    }

    return out;
}

/** Normalise one post record across the two hosts' field names. */
const normalisePost = (post) => ({
    text: post.text ?? post.commentary ?? post.content ?? '',
    postedAt: post.postedDate ?? post.postedAt ?? post.date ?? null,
    url: post.postUrl ?? post.url ?? null,
    reactions: post.totalReactionCount ?? post.likeCount ?? null,
});

/**
 * Fetch up to `pages` pages of posts, newest first.
 *
 * The old code took page one and cut it at 25. Because the caller then *replaced*
 * the stored posts with that page, the archive was permanently capped at the most
 * recent page and older posts were dropped as new ones pushed them off — which is
 * how a 19-month gap opened up in the knowledge base.
 *
 * Pagination costs one credit per page against the free monthly 50, so the daily
 * cron stays at one page (new posts are always on page one, and the merge in
 * ./index.js keeps everything already collected). Ask for more only for a
 * deliberate backfill: `node server/scripts/refresh-linkedin.js --deep`.
 *
 * The two hosts paginate differently, so both are supported: a `paginationToken`
 * echoed in the response, or a numeric `start` offset.
 */
async function fetchPosts(username, pages = 1) {
    const collected = [];
    let token = null;

    for (let page = 0; page < Math.max(1, pages); page++) {
        const params = { username };
        // LinkedIn paginates in blocks of 50 regardless of how many a page
        // returns, so the offset advances by PAGE_SIZE, not by items.length.
        if (token) params.paginationToken = token;
        else if (page > 0) params.start = page * PAGE_SIZE;

        let body;
        try {
            body = await callWithFallback('/get-profile-posts', params);
        } catch (err) {
            // A failed later page must not discard the pages that succeeded —
            // returning [] here would throw away a good page-one scrape and, via
            // the caller's cascade, leave the archive untouched for no reason.
            console.warn(
                `[linkedin] posts page ${page + 1} failed (${err.message}) — ` +
                    `keeping the ${collected.length} post(s) already fetched`,
            );
            if (collected.length === 0) throw err;
            break;
        }

        const items = Array.isArray(body) ? body : (body.items ?? body.posts ?? body.data ?? []);
        if (!items.length) break;

        collected.push(...items.map(normalisePost));
        if (pages > 1) {
            console.log(`[linkedin] page ${page + 1}: ${items.length} posts (${collected.length} total)`);
        }

        token = body?.paginationToken ?? body?.pagination_token ?? null;
    }

    return collected;
}

/** linkedin.com/in/<username>/ -> <username> */
function usernameFrom(url) {
    const m = /\/in\/([^/?#]+)/.exec(url);
    if (!m) throw new Error(`Cannot extract username from ${url}`);
    return m[1];
}
