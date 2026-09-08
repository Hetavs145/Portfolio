/**
 * GitHub -> chunks. Public, read-only, unauthenticated.
 *
 * No token is used anywhere, which is the point: private repos are structurally
 * unreachable rather than merely filtered out. Unauthenticated GitHub allows
 * 60 requests/hour per IP, which comfortably covers ~15 repos plus READMEs.
 *
 * An allowlist is required, not just a username: the two headline projects live
 * under other accounts (fjiolla/Kontexo and kanakkj07/LLM-Co-Pilot-...), so a
 * scraper pointed only at /users/Hetavs145/repos would miss both.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeChunk, splitLong } from '../chunk.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = path.join(HERE, '..', '..', 'data', 'repos.json');

const API = 'https://api.github.com';
const UA = { 'User-Agent': 'hetav-portfolio-agent', Accept: 'application/vnd.github+json' };

async function getJson(url) {
    const res = await fetch(url, { headers: UA });
    if (res.status === 403) {
        throw new Error('GitHub rate limit reached (60/hr unauthenticated). Try again later.');
    }
    if (!res.ok) return null;
    return res.json();
}

async function getReadme(fullName, maxChars) {
    const res = await fetch(`${API}/repos/${fullName}/readme`, {
        headers: { ...UA, Accept: 'application/vnd.github.raw' },
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
        // Forks are noise by default, but TrafficMind is a deliberate fork of the
        // team's hackathon repo — keeping the fork preserves their attribution,
        // so it has to be allowlisted back in.
        if (cfg.skipForks && r.fork && !keepForks.has(r.full_name)) return false;
        if ((cfg.skip || []).includes(r.name)) return false;
        seen.add(r.full_name);
        return true;
    });

    for (const repo of repos) {
        const readme = await getReadme(repo.full_name, cfg.readmeChars ?? 800);
        const body = [describe(repo), readme].filter(Boolean).join(' ');
        if (!body) continue;
        chunks.push(
            ...splitLong('github', `Repository — ${repo.name}`, `${repo.html_url}. ${body}`),
        );
    }

    // One roll-up chunk so "what has he been working on lately" retrieves something
    // even when no single repo is a strong match.
    const recent = repos
        .slice()
        .sort((a, b) => (b.pushed_at || '').localeCompare(a.pushed_at || ''))
        .slice(0, 8)
        .map((r) => `${r.name} (${r.language || 'mixed'}, updated ${(r.pushed_at || '').slice(0, 10)})`);

    if (recent.length) {
        chunks.push(
            makeChunk(
                'github',
                'Most recently updated repositories',
                `Hetav's most recently updated public repositories, newest first: ${recent.join('; ')}.`,
            ),
        );
    }

    return chunks;
}
