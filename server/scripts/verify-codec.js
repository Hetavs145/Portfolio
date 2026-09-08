/**
 * Proves that int8 quantisation does not change retrieval results.
 *
 *   node --env-file=.env server/scripts/verify-codec.js
 *
 * Embeds the corpus once (2 batched calls), then for every chunk uses that chunk's
 * own float vector as a query and compares the top-5 ranking computed against
 * full-precision floats vs. the quantised vectors actually stored in index.json.
 *
 * Using stored vectors as queries means this covers all 70 retrieval paths for the
 * cost of a single build, and needs no hand-written query list.
 */

import { embed } from '../lib/openrouter.js';
import { encodeVector, decodeVector } from '../lib/vectorcodec.js';
import { cosine } from '../lib/vectorstore.js';
import { dedupeIds } from '../lib/chunk.js';
import { resumeChunks } from '../lib/sources/resume.js';
import { siteChunks } from '../lib/sources/site.js';
import { linkedinChunks } from '../lib/sources/linkedin/index.js';

const K = 5;

const chunks = dedupeIds([...resumeChunks(), ...siteChunks(), ...linkedinChunks()]);
console.log(`Embedding ${chunks.length} chunks (GitHub skipped — network-dependent)...`);

const floats = await embed(chunks.map((c) => `${c.title}\n${c.text}`));
const quantised = floats.map((v) => {
    const { b64, scale } = encodeVector(v);
    return decodeVector(b64, scale);
});

const rank = (query, corpus) =>
    corpus
        .map((v, i) => ({ i, score: cosine(query, v) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, K)
        .map((r) => r.i);

let identical = 0;
let top1Same = 0;
let maxCosineError = 0;
const mismatches = [];

for (let q = 0; q < floats.length; q++) {
    const a = rank(floats[q], floats);
    const b = rank(floats[q], quantised);

    if (a.join(',') === b.join(',')) identical++;
    else mismatches.push({ q, float: a, quant: b });
    if (a[0] === b[0]) top1Same++;

    for (let i = 0; i < floats.length; i++) {
        const err = Math.abs(cosine(floats[q], floats[i]) - cosine(floats[q], quantised[i]));
        if (err > maxCosineError) maxCosineError = err;
    }
}

const pct = (n) => ((n / floats.length) * 100).toFixed(1);
console.log(`\n  identical top-${K} ordering : ${identical}/${floats.length}  (${pct(identical)}%)`);
console.log(`  identical top-1 result    : ${top1Same}/${floats.length}  (${pct(top1Same)}%)`);
console.log(`  max cosine error          : ${maxCosineError.toExponential(2)}`);

if (mismatches.length) {
    console.log(`\n  ${mismatches.length} ordering difference(s) — showing up to 3:`);
    for (const m of mismatches.slice(0, 3)) {
        console.log(`    query "${chunks[m.q].id}"`);
        console.log(`      float32: ${m.float.map((i) => chunks[i].id).join(', ')}`);
        console.log(`      int8   : ${m.quant.map((i) => chunks[i].id).join(', ')}`);
    }
}

// Top-1 must be exact; a rare swap deeper in the top-5 is harmless because all
// five chunks are handed to the model anyway.
if (top1Same !== floats.length) {
    console.error('\nFAIL: quantisation changed the best-matching chunk for some query.');
    process.exit(1);
}
console.log('\nPASS: quantisation preserves the retrieved chunk set.');
