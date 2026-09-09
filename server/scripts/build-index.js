/**
 * Builds server/data/index.json — the committed vector index.
 *
 *   npm run build:index                # everything
 *   npm run build:index -- --no-github # skip the GitHub scrape
 *   npm run build:index -- --dry       # chunk only, no embedding calls
 *   npm run build:index -- --strict    # fail if any source fell back to cache
 *
 * Every run is a full rebuild. The old index is read into memory (so a failed
 * source can carry its last-good chunks forward), then deleted from disk before
 * anything is collected, then written fresh. No vector is ever reused: all
 * chunks are re-embedded every time, and a crash mid-run leaves no half-updated
 * file behind pretending to be current.
 *
 * The vectors are genuine OpenRouter `nvidia/nemotron-3-embed-1b:free` output.
 * They're generated here rather than at server boot because both Render free
 * (ephemeral filesystem, 15-min spin-down) and Vercel (read-only filesystem, no
 * warm state) would lose the cache and re-embed on every cold start — which at
 * ~3 calls a rebuild would exhaust the 50/day free quota before a visitor asked
 * anything. Reading a committed file is the thing both platforms do well.
 *
 * Re-run after editing a resume, adding a repo, or refreshing LinkedIn.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { embed } from '../lib/openrouter.js';
import { EMBED_MODEL } from '../lib/config.js';
import { dedupeIds } from '../lib/chunk.js';
import { encodeVector } from '../lib/vectorcodec.js';
import { staleSources, freshnessReport } from '../lib/freshness.js';
import { resumeChunks } from '../lib/sources/resume.js';
import { githubChunks } from '../lib/sources/github.js';
import { siteChunks } from '../lib/sources/site.js';
import { websiteChunks } from '../lib/sources/website.js';
import { linkedinChunks } from '../lib/sources/linkedin/index.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'data', 'index.json');

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);

/** The index currently on disk, or null. Used to survive a failed source fetch. */
function previousIndex() {
    try {
        return JSON.parse(fs.readFileSync(OUT, 'utf8'));
    } catch {
        return null;
    }
}

/**
 * Chunks from the previous index for one source, stripped of their vectors so
 * they get re-embedded with the rest.
 *
 * A rate-limited GitHub scrape used to drop every repo chunk from the index and
 * still write the file, so the bot would quietly forget its own projects until
 * someone noticed. Carrying the last good chunks forward makes a failed fetch a
 * staleness problem rather than an amnesia problem.
 */
function carryForward(prev, source) {
    return (prev?.chunks ?? [])
        .filter((c) => c.source === source)
        .map(({ v, s, vector, ...chunk }) => chunk);
}

/**
 * Delete the committed index before rebuilding.
 *
 * Overwriting at the end would be equivalent on the happy path, but an explicit
 * purge makes the contract visible and means a build that dies halfway leaves no
 * stale index masquerading as fresh. Callers must read `previousIndex()` first if
 * they want its chunks.
 */
function purgeIndex() {
    if (!fs.existsSync(OUT)) return;
    fs.rmSync(OUT);
    console.log('  purged previous index.json — every chunk is re-embedded from scratch');
}

async function collect(prev) {
    const chunks = [];

    const resume = resumeChunks();
    chunks.push(...resume);
    console.log(`  resume    ${String(resume.length).padStart(3)} chunks`);

    const site = siteChunks();
    chunks.push(...site);
    console.log(`  site      ${String(site.length).padStart(3)} chunks`);

    // Rendered copy from the live site. Complements site.js: that one reads the
    // data modules, this one reads whatever a visitor actually sees (About and
    // Experience keep their prose inline in JSX, so nothing else covers them).
    const website = websiteChunks();
    const keptWebsite = website.length ? website : carryForward(prev, 'website');
    chunks.push(...keptWebsite);
    console.log(
        `  website   ${String(keptWebsite.length).padStart(3)} chunks` +
            (website.length === 0
                ? keptWebsite.length
                    ? '  (no fresh crawl — kept previous)'
                    : '  (no crawl yet — run `npm run refresh:website`)'
                : ''),
    );

    const linkedin = linkedinChunks();
    chunks.push(...linkedin);
    console.log(
        `  linkedin  ${String(linkedin.length).padStart(3)} chunks` +
            (linkedin.length === 0 ? '  (no snapshot yet — run refresh-linkedin.js)' : ''),
    );

    if (has('--no-github')) {
        const kept = carryForward(prev, 'github');
        chunks.push(...kept);
        console.log(`  github    ${String(kept.length).padStart(3)} chunks  (--no-github: kept previous)`);
    } else {
        let gh = [];
        let failure = null;
        try {
            gh = await githubChunks();
        } catch (err) {
            // A GitHub outage or rate limit must not block an index rebuild —
            // the resume and site sources still make a usable corpus.
            failure = err.message;
        }

        if (gh.length) {
            // Partial loss is the common case, not total failure: a rate limit
            // part-way through drops the READMEs it didn't reach, so the fetch
            // "succeeds" with a quietly thinner corpus. When the source reports
            // itself degraded, top the fresh set back up from the previous index
            // rather than shipping the gap.
            const degraded = staleSources().some((r) => r.source === 'github');
            let merged = gh;
            if (degraded) {
                const haveIds = new Set(gh.map((c) => c.id));
                const restored = carryForward(prev, 'github').filter((c) => !haveIds.has(c.id));
                if (restored.length) {
                    merged = [...gh, ...restored];
                    console.warn(
                        `  github    restored ${restored.length} chunk(s) from the previous index ` +
                            `(fetch was degraded and returned fewer)`,
                    );
                }
            }
            chunks.push(...merged);
            console.log(`  github    ${String(merged.length).padStart(3)} chunks`);
        } else {
            const kept = carryForward(prev, 'github');
            chunks.push(...kept);
            console.warn(
                `  github    ${String(kept.length).padStart(3)} chunks  ` +
                    `(fetch returned nothing${failure ? `: ${failure}` : ''} — kept previous index's chunks)`,
            );
            if (!kept.length) console.warn('  github    WARNING: no previous chunks either — index has no GitHub data');
        }
    }

    return dedupeIds(chunks);
}

async function main() {
    console.log(`Building index with ${EMBED_MODEL}\n`);
    // Captured before the write — reading it back afterwards would compare the
    // new index against itself.
    const prev = previousIndex();
    const previousCount = prev?.chunks?.length ?? 0;

    // Read first, then purge, then rebuild: the in-memory copy is what a failed
    // source falls back to, so deleting the file loses nothing.
    if (!has('--dry')) purgeIndex();

    const chunks = await collect(prev);
    console.log(`\n  total     ${chunks.length} chunks`);

    if (chunks.length === 0) throw new Error('No chunks collected — nothing to embed');

    if (has('--dry')) {
        console.log('\n--dry: skipping embeddings. Sample:');
        for (const c of chunks.slice(0, 5)) console.log(`  ${c.id}\n    ${c.text.slice(0, 100)}...`);
        return;
    }

    // Embedding the title alongside the body measurably helps short lookups
    // ("Kontexo", "CGPA") match the right chunk.
    const inputs = chunks.map((c) => `${c.title}\n${c.text}`);

    console.log(`\nEmbedding ${inputs.length} chunks...`);
    const started = Date.now();
    const vectors = await embed(inputs);
    console.log(`Embedded in ${((Date.now() - started) / 1000).toFixed(1)}s`);

    const dim = vectors[0]?.length ?? 0;
    if (!dim) throw new Error('Embedding returned zero-length vectors');
    if (vectors.some((v) => v.length !== dim)) {
        throw new Error('Inconsistent embedding dimensions across chunks');
    }

    // Vectors are stored int8-quantized + base64 (see lib/vectorcodec.js): ~10x
    // smaller than JSON floats, which matters because the daily refresh workflow
    // commits this file.
    const index = {
        model: EMBED_MODEL,
        dim,
        encoding: 'int8-base64',
        builtAt: new Date().toISOString(),
        chunks: chunks.map((c, i) => {
            const { b64, scale } = encodeVector(vectors[i]);
            return { ...c, v: b64, s: scale };
        }),
    };

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(index, null, 0) + '\n');

    const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
    console.log(`\nWrote ${OUT}`);
    console.log(`  ${index.chunks.length} chunks · dim ${dim} · ${mb} MB`);

    const bySource = index.chunks.reduce((acc, c) => {
        acc[c.source] = (acc[c.source] || 0) + 1;
        return acc;
    }, {});
    console.log(`  by source: ${JSON.stringify(bySource)}`);

    // A quiet 30% shrink is how a knowledge base rots: nothing errors, the bot
    // just knows less. Say it out loud.
    const stale = staleSources();
    if (stale.length) {
        console.warn(
            `\n  DEGRADED: ${stale.map((r) => `${r.source} (${r.reason})`).join(', ')}`,
        );
    } else if (freshnessReport().length) {
        console.log(`  all live sources fresh`);
    }

    if (has('--strict') && stale.length) {
        throw new Error(
            `--strict: ${stale.length} source(s) served cached or stale data: ` +
                stale.map((r) => `${r.source} — ${r.reason}`).join('; '),
        );
    }

    if (previousCount && index.chunks.length < previousCount * 0.7) {
        console.warn(
            `\n  WARNING: chunk count fell from ${previousCount} to ${index.chunks.length}. ` +
                `Check for a failed source fetch before committing this index.`,
        );
    }
}

main().catch((err) => {
    console.error(`\nIndex build failed: ${err.message}`);
    process.exit(1);
});
