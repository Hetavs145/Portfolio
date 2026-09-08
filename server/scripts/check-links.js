/**
 * Verifies every external link in the projects data actually resolves.
 *
 *   npm run check:links
 *
 * This exists because three project cards shipped pointing at 404s
 * (Hetavs145/TrafficMind, Hetavs145/YouTube-Upload-Agent, kernel-scribe-sim)
 * with nothing to catch it. Exits non-zero on any dead link so CI can gate on it.
 */

import { projects } from '../../src/data/projects.js';

const TIMEOUT_MS = 12_000;

async function check(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        // Some hosts reject HEAD; fall back to a ranged GET before believing a failure.
        let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
        if (res.status === 405 || res.status === 403 || res.status === 404) {
            res = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                headers: { Range: 'bytes=0-0' },
                signal: controller.signal,
            });
        }
        return { ok: res.ok, status: res.status };
    } catch (err) {
        return { ok: false, status: err.name === 'AbortError' ? 'timeout' : err.message };
    } finally {
        clearTimeout(timer);
    }
}

const targets = [];
for (const p of projects) {
    for (const field of ['github', 'live', 'youtube']) {
        if (p[field]) targets.push({ project: p.title, field, url: p[field] });
    }
}

console.log(`Checking ${targets.length} links across ${projects.length} projects\n`);

const results = await Promise.all(
    targets.map(async (t) => ({ ...t, ...(await check(t.url)) })),
);

let failures = 0;
for (const r of results) {
    const mark = r.ok ? 'ok  ' : 'DEAD';
    if (!r.ok) failures++;
    console.log(`  ${mark} ${String(r.status).padEnd(7)} ${r.project} (${r.field})`);
    if (!r.ok) console.log(`       ${r.url}`);
}

console.log(`\n${results.length - failures}/${results.length} links OK`);
if (failures > 0) {
    console.error(`${failures} dead link(s) — fix src/data/projects.js`);
    process.exit(1);
}
