/**
 * LinkedIn Member Data Portability API adapter.
 *
 * This is the best option that exists: free, official, ToS-clean, self-serve with
 * no review, ~1-year token, and it returns every domain including posts. It runs
 * fine from GitHub Actions because it's a real API, not scraping.
 *
 * The catch: it is gated to members located in the EEA + Switzerland. Check
 * whether you're eligible before wiring this up — it takes about ten minutes:
 *
 *   1. Create an app at linkedin.com/developers/apps
 *   2. Do NOT create your own Company Page. Attach the app to LinkedIn's shared
 *      linkedin.com/company/member-data-portability-member-default-company
 *      (the product will not appear otherwise).
 *   3. Products tab -> "Member Data Portability API (Member)" -> Request access.
 *      Granted instantly if you're eligible.
 *   4. Generate a token via Developer Portal -> Docs and tools -> OAuth Token Tools
 *      and set it as LINKEDIN_DMA_TOKEN.
 *
 * If the product doesn't appear in step 3, you aren't eligible — use the
 * RapidAPI adapter instead. Nothing else in the pipeline changes.
 */

const BASE = 'https://api.linkedin.com/rest/memberSnapshotData';

// Only this version string works; anything else returns 426 NONEXISTENT_VERSION.
const LINKEDIN_VERSION = '202312';

const DOMAINS = [
    'PROFILE',
    'POSITIONS',
    'EDUCATION',
    'SKILLS',
    'CERTIFICATIONS',
    'COURSES',
    'HONORS',
    'PROJECTS',
    'MEMBER_SHARE_INFO', // all shared/re-shared posts
];

async function snapshot(domain, token) {
    const url = `${BASE}?q=criteria&domain=${domain}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Linkedin-Version': LINKEDIN_VERSION,
        },
    });

    if (!res.ok) throw new Error(`LinkedIn DMA ${domain} -> HTTP ${res.status}`);

    const json = await res.json();
    // Each element carries snapshotData: an array of flat key/value records.
    return (json.elements ?? []).flatMap((el) => el.snapshotData ?? []);
}

export async function fetchLinkedIn() {
    const token = process.env.LINKEDIN_DMA_TOKEN;
    if (!token) throw new Error('LINKEDIN_DMA_TOKEN is not set');

    const out = {
        source: 'dma',
        profileUrl: process.env.LINKEDIN_PROFILE_URL || null,
        fetchedAt: new Date().toISOString(),
        domains: {},
    };

    // Sequential rather than parallel — all 17 domains complete in under a minute
    // and this stays polite to the API.
    for (const domain of DOMAINS) {
        try {
            out.domains[domain] = await snapshot(domain, token);
        } catch (err) {
            console.warn(`[linkedin:dma] ${domain} failed: ${err.message}`);
            out.domains[domain] = [];
        }
    }

    // Normalise into the same shape the RapidAPI adapter produces, so downstream
    // chunking doesn't care which adapter ran.
    out.profile = {
        headline: out.domains.PROFILE?.[0]?.['Headline'] ?? null,
        summary: out.domains.PROFILE?.[0]?.['Summary'] ?? null,
        location: out.domains.PROFILE?.[0]?.['Geo Location'] ?? null,
        positions: out.domains.POSITIONS ?? [],
        education: out.domains.EDUCATION ?? [],
        skills: (out.domains.SKILLS ?? []).map((s) => s.Name ?? s.Skill ?? s),
        certifications: out.domains.CERTIFICATIONS ?? [],
        honors: out.domains.HONORS ?? [],
        projects: out.domains.PROJECTS ?? [],
    };

    out.posts = (out.domains.MEMBER_SHARE_INFO ?? []).slice(0, 25).map((p) => ({
        text: p.ShareCommentary ?? p.Commentary ?? '',
        postedAt: p.Date ?? null,
        url: p.ShareLink ?? p.SharedUrl ?? null,
        reactions: null,
    }));

    return out;
}
