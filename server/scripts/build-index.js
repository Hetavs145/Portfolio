/**
 * Builds server/data/index.json — the committed vector index.
 *
 *   npm run build:index                # everything
 *   npm run build:index -- --no-github # skip the GitHub scrape
 *   npm run build:index -- --dry       # chunk only, no embedding calls
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
import { resumeChunks } from '../lib/sources/resume.js';
import { githubChunks } from '../lib/sources/github.js';
import { siteChunks } from '../lib/sources/site.js';
import { linkedinChunks } from '../lib/sources/linkedin/index.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'data', 'index.json');

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);

async function collect() {
    const chunks = [];

    const resume = resumeChunks();
    chunks.push(...resume);
    console.log(`  resume    ${String(resume.length).padStart(3)} chunks`);

    const site = siteChunks();
    chunks.push(...site);
    console.log(`  site      ${String(site.length).padStart(3)} chunks`);

    const linkedin = linkedinChunks();
    chunks.push(...linkedin);
    console.log(
        `  linkedin  ${String(linkedin.length).padStart(3)} chunks` +
            (linkedin.length === 0 ? '  (no snapshot yet — run refresh-linkedin.js)' : ''),
    );

    if (has('--no-github')) {
        console.log('  github      0 chunks  (skipped via --no-github)');
    } else {
        try {
            const gh = await githubChunks();
            chunks.push(...gh);
            console.log(`  github    ${String(gh.length).padStart(3)} chunks`);
        } catch (err) {
            // A GitHub outage or rate limit must not block an index rebuild —
            // the resume and site sources still make a usable corpus.
            console.warn(`  github      0 chunks  (failed: ${err.message})`);
        }
    }

    return dedupeIds(chunks);
}

async function main() {
    console.log(`Building index with ${EMBED_MODEL}\n`);
    const chunks = await collect();
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
}

main().catch((err) => {
    console.error(`\nIndex build failed: ${err.message}`);
    process.exit(1);
});
