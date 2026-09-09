/**
 * GitHub -> chunks. Public, read-only.
 *
 * Private repos must never reach the knowledge base. That is enforced twice:
 *
 *  1. The only credential ever used is GITHUB_TOKEN as injected by GitHub Actions,
 *     which is scoped to THIS repository alone. It raises the rate limit to
 *     ~1000/hr and can read public data anywhere, but cannot open another private
 *     repo. Never put a personal access token here — a PAT with `repo` scope
 *     would make private repos reachable, which is exactly what we're preventing.
 *  2. Anything marked `private` is dropped from the repo list regardless, so even
 *     a mis-set credential cannot leak one into the index.
 *
 * Unauthenticated (local runs) GitHub allows only 60 requests/hour per IP, and a
 * full build spends roughly half of that — two builds in an hour get nothing.
 *
 * An allowlist is required, not just a username: the two headline projects live
 * under other accounts (fjiolla/Kontexo and kanakkj07/LLM-Co-Pilot-...), so a
 * scraper pointed only at /users/Hetavs145/repos would miss both.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeChunk, splitLong } from '../chunk.js';
import { reportSource } from '../freshness.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = path.join(HERE, '..', '..', 'data', 'repos.json');
// Last-good commit cache. Unauthenticated GitHub allows 60 requests/hour and one
// full index build spends roughly half of that, so a rebuild run twice in an hour
// gets nothing back. Without a cache the commit chunks would silently disappear
// from the index — the bot would quietly stop knowing what he's working on, with
// no error anywhere. Same pattern as the LinkedIn snapshot.
const COMMIT_CACHE = path.join(HERE, '..', '..', 'data', 'commits.json');

/**
 * Cached commits stop being evidence of "current work" quickly, so entries older
 * than MAX_CACHE_AGE_DAYS are dropped rather than kept forever. A fallback that
 * never expires is just a slower way of lying.
 */
const MAX_CACHE_AGE_DAYS = 14;

function readCommitCache() {
    let raw;
    try {
        raw = JSON.parse(fs.readFileSync(COMMIT_CACHE, 'utf8'));
    } catch {
        return {};
    }

    const cutoff = new Date(Date.now() - MAX_CACHE_AGE_DAYS * 86400_000)
        .toISOString()
        .slice(0, 10);

    const kept = {};
    let expired = 0;
    for (const [repo, commits] of Object.entries(raw)) {
        if (Array.isArray(commits) && commits[0]?.date >= cutoff) kept[repo] = commits;
        else expired++;
    }
    if (expired) {
        console.warn(`[github] dropped ${expired} commit cache entr(ies) older than ${MAX_CACHE_AGE_DAYS} days`);
    }
    return kept;
}

function writeCommitCache(cache) {
    fs.mkdirSync(path.dirname(COMMIT_CACHE), { recursive: true });
    fs.writeFileSync(COMMIT_CACHE, JSON.stringify(cache, null, 2) + '\n');
}

const API = 'https://api.github.com';

/**
 * Only the Actions-scoped GITHUB_TOKEN is honoured. See the file header: this
 * raises the rate limit without granting access to any private repository.
 */
const authHeaders = () => {
    const token = process.env.GITHUB_TOKEN || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const UA = () => ({
    'User-Agent': 'hetav-portfolio-agent',
    Accept: 'application/vnd.github+json',
    ...authHeaders(),
});

async function getJson(url) {
    const res = await fetch(url, { headers: UA() });
    if (res.status === 403) {
        throw new Error('GitHub rate limit reached (60/hr unauthenticated). Try again later.');
    }
    if (!res.ok) return null;
    return res.json();
}

async function getReadme(fullName, maxChars) {
    const res = await fetch(`${API}/repos/${fullName}/readme`, {
        headers: { ...UA(), Accept: 'application/vnd.github.raw' },
    });
    if (!res.ok) return null;
    const raw = await res.text();

    // Strip badges, images, links and headings down to prose worth embedding.
    return raw
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^#+\s*/gm, '')
        .replace(/[*_>`|-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxChars);
}

/**
 * Recent commit subjects for one repo. Best-effort: a 404 (empty repo) or a rate
 * limit returns [] rather than failing the whole build.
 */
async function getCommits(fullName, limit = 5) {
    const data = await getJson(`${API}/repos/${fullName}/commits?per_page=${limit}`).catch(() => null);
    if (!Array.isArray(data)) return [];
    return data
        .map((c) => ({
            date: (c.commit?.committer?.date || c.commit?.author?.date || '').slice(0, 10),
            message: (c.commit?.message || '').split('\n')[0].trim(),
        }))
        .filter((c) => c.date && c.message);
}

function describe(repo) {
    const bits = [
        repo.description || null,
        repo.language ? `Primary language: ${repo.language}.` : null,
        repo.topics?.length ? `Topics: ${repo.topics.join(', ')}.` : null,
        repo.homepage ? `Live at ${repo.homepage}.` : null,
        repo.stargazers_count ? `${repo.stargazers_count} stars.` : null,
        repo.pushed_at ? `Last updated ${repo.pushed_at.slice(0, 10)}.` : null,
    ].filter(Boolean);
    return bits.join(' ');
}

export async function githubChunks() {
    const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
    const chunks = [];
    const seen = new Set();

    const owned = (await getJson(`${API}/users/${cfg.user}/repos?per_page=100&sort=updated`)) || [];
    const extras = [];
    for (const fullName of cfg.extra || []) {
        const repo = await getJson(`${API}/repos/${fullName}`);
        if (repo) extras.push(repo);
        else console.warn(`[github] allowlisted repo not reachable: ${fullName}`);
    }

    const keepForks = new Set(cfg.keepForks || []);

    const repos = [...owned, ...extras].filter((r) => {
        if (!r || seen.has(r.full_name)) return false;
        // Belt and braces: private repos never enter the corpus, whatever
        // credential the API call happened to run under.
        if (r.private) return false;
        // Forks are noise by default, but TrafficMind is a deliberate fork of the
        // team's hackathon repo — keeping the fork preserves their attribution,
        // so it has to be allowlisted back in.
        if (cfg.skipForks && r.fork && !keepForks.has(r.full_name)) return false;
        if ((cfg.skip || []).includes(r.name)) return false;
        seen.add(r.full_name);
        return true;
    });

    // Newest push first, so "his most recently updated repo" is index 0 everywhere.
    repos.sort((a, b) => (b.pushed_at || '').localeCompare(a.pushed_at || ''));

    for (const [i, repo] of repos.entries()) {
        const readme = await getReadme(repo.full_name, cfg.readmeChars ?? 800);
        const body = [describe(repo), readme].filter(Boolean).join(' ');
        if (!body) continue;
        const pushed = (repo.pushed_at || '').slice(0, 10);
        const rank =
            i === 0 && pushed
                ? ' This is the repository he pushed to most recently — his current active project.'
                : '';
        chunks.push(
            ...splitLong(
                'github',
                `Repository — ${repo.name}`,
                `${repo.html_url}.${pushed ? ` Last pushed ${pushed}.` : ''}${rank} ${body}`,
                { date: pushed, kind: 'repo', url: repo.html_url },
            ),
        );
    }

    // Commit-level detail for the handful of repos he is actually working in.
    // "What are you building right now?" should be answerable from commits, not
    // from a six-month-old README.
    const activeCount = Math.min(cfg.commitRepos ?? 5, repos.length);
    const activity = [];
    const cache = readCommitCache();
    let stale = 0;

    for (const repo of repos.slice(0, activeCount)) {
        let commits = await getCommits(repo.full_name, cfg.commitsPerRepo ?? 5);

        if (commits.length) {
            cache[repo.full_name] = commits;
        } else if (cache[repo.full_name]?.length) {
            commits = cache[repo.full_name];
            stale++;
        }
        if (!commits.length) continue;

        activity.push({ repo: repo.name, date: commits[0].date, message: commits[0].message });
        chunks.push(
            ...splitLong(
                'github',
                `Recent commits — ${repo.name}`,
                `Latest commits in ${repo.name} (${repo.html_url}), newest first: ` +
                    commits.map((c) => `${c.date} "${c.message}"`).join('; ') +
                    `. The most recent commit was ${commits[0].date}.`,
                { date: commits[0].date, kind: 'commit', url: repo.html_url },
            ),
        );
    }

    writeCommitCache(cache);
    if (stale) {
        console.warn(
            `[github] commits for ${stale} repo(s) came from cache — likely rate limited ` +
                `(60/hr unauthenticated; set GITHUB_TOKEN in Actions for ~1000/hr).`,
        );
        reportSource('github', {
            fresh: false,
            reason: `${stale} repo(s) used cached commits (rate limit?)`,
        });
    } else {
        reportSource('github', { fresh: true });
    }

    if (activity.length) {
        activity.sort((a, b) => b.date.localeCompare(a.date));
        chunks.push(
            makeChunk(
                'github',
                'Current work — latest commit activity',
                `What Hetav is working on right now, by most recent commit: ` +
                    activity.map((a) => `${a.repo} on ${a.date} ("${a.message}")`).join('; ') +
                    `. His single most recent commit anywhere is in ${activity[0].repo} on ${activity[0].date}.`,
                { date: activity[0].date, kind: 'timeline' },
            ),
        );
    }

    // One roll-up chunk so "what has he been working on lately" retrieves something
    // even when no single repo is a strong match.
    const recent = repos
        .slice(0, 8)
        .map((r) => `${r.name} (${r.language || 'mixed'}, updated ${(r.pushed_at || '').slice(0, 10)})`);

    if (recent.length) {
        chunks.push(
            makeChunk(
                'github',
                'Most recently updated repositories',
                `Hetav's most recently updated public repositories, newest first: ${recent.join('; ')}.`,
                { date: (repos[0].pushed_at || '').slice(0, 10), kind: 'timeline' },
            ),
        );
    }

    return chunks;
}
