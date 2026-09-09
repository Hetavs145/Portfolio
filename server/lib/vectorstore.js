/**
 * In-memory vector store over the precomputed index.
 *
 * The vectors in index.json are genuine OpenRouter `nemotron-3-embed-1b:free`
 * embeddings — precomputing only changes *when* they are generated, not by whom.
 * Both Render free (ephemeral filesystem, 15-min spin-down) and Vercel (read-only
 * filesystem, no warm state) can read a committed file but cannot cache one they
 * built, so building at boot would re-embed the corpus on every cold start and
 * exhaust the 50/day free quota before a visitor ever asked anything.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMBED_MODEL, TOP_K } from './config.js';
import { decodeVector } from './vectorcodec.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const INDEX_PATH = path.join(HERE, '..', 'data', 'index.json');

let store = null; // { model, dim, builtAt, chunks: [{ id, source, title, text, vector }] }
let loadedMtimeMs = 0; // mtime of the file `store` was built from

/** Cosine similarity. Vectors are not pre-normalised, so divide by both norms. */
export function cosine(a, b) {
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
}

/**
 * Load the committed index. Returns null when it is missing or was built with a
 * different embedding model — callers then fall back to lexical retrieval, or a
 * build script regenerates it.
 */
export function loadIndex({ quiet = false } = {}) {
    if (!fs.existsSync(INDEX_PATH)) {
        if (!quiet) console.warn(`[vectorstore] no index at ${INDEX_PATH} — lexical retrieval only`);
        return null;
    }

    // Reload when the file changes underneath us. Without this the first request
    // pins the index in module state for the life of the process, so a rebuilt
    // and redeployed index.json would still be answered from the old vectors on
    // any host that keeps the process warm.
    const mtimeMs = fs.statSync(INDEX_PATH).mtimeMs;
    if (store && mtimeMs === loadedMtimeMs) return store;
    if (store && !quiet) {
        console.log('[vectorstore] index.json changed on disk — reloading');
    }
    store = null;

    try {
        const parsed = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
        if (!Array.isArray(parsed.chunks) || parsed.chunks.length === 0) {
            console.warn('[vectorstore] index.json has no chunks');
            return null;
        }
        const norm = (m) => (m || "").replace(/:free$/, "");
        if (norm(parsed.model) !== norm(EMBED_MODEL)) {
            console.warn(
                `[vectorstore] index built with "${parsed.model}" but config expects "${EMBED_MODEL}" — ignoring vectors`,
            );
            // Keep the chunks: their text is still usable for lexical retrieval.
            store = { ...parsed, vectorsUsable: false };
            loadedMtimeMs = mtimeMs;
            return store;
        }
        // Decode once at load; topK then runs against Float32Arrays.
        for (const c of parsed.chunks) {
            if (c.v && !c.vector) c.vector = decodeVector(c.v, c.s);
        }
        store = { ...parsed, vectorsUsable: true };
        loadedMtimeMs = mtimeMs;
        if (!quiet) {
            console.log(
                `[vectorstore] loaded ${store.chunks.length} chunks (dim ${store.dim}, built ${store.builtAt})`,
            );
        }
        return store;
    } catch (err) {
        console.error('[vectorstore] failed to parse index.json:', err.message);
        return null;
    }
}

/** Drop the cached index so the next load re-reads from disk. Used by build scripts. */
export function resetIndex() {
    store = null;
    loadedMtimeMs = 0;
}

/** All chunks, or [] when no index is present. */
export function allChunks() {
    return loadIndex({ quiet: true })?.chunks ?? [];
}

/**
 * Chunks eligible for similarity search.
 *
 * Timeline chunks are excluded. They are navigation artifacts — dense lists of
 * dates and clipped sentences spanning every topic — so they score high against
 * almost any query and were crowding real answers out of the top-k ("is the IMNU
 * resume your actual resume?" returned three LinkedIn timelines). They are still
 * retrieved, but deliberately, by the recency layer that pins them for temporal
 * questions. See lib/recency.js.
 */
function searchableChunks() {
    return allChunks().filter((c) => c.kind !== 'timeline');
}

/** Semantic search. Requires a loaded index with usable vectors. */
export function topK(queryVector, k = TOP_K) {
    const idx = loadIndex({ quiet: true });
    if (!idx || !idx.vectorsUsable) return [];

    return searchableChunks()
        .map((c) => ({ chunk: c, score: cosine(queryVector, c.vector) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
}

const STOPWORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'of', 'to', 'in', 'on',
    'at', 'for', 'with', 'and', 'or', 'but', 'if', 'then', 'than', 'that', 'this', 'these', 'those',
    'it', 'its', 'he', 'she', 'they', 'his', 'her', 'their', 'what', 'which', 'who', 'whom', 'how',
    'when', 'where', 'why', 'do', 'does', 'did', 'has', 'have', 'had', 'can', 'could', 'would',
    'should', 'you', 'your', 'me', 'my', 'i', 'about', 'tell', 'us',
]);

const tokenize = (s) =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9+#./\s-]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1 && !STOPWORDS.has(t));

/**
 * Lexical fallback — IDF-weighted term overlap over the same chunks.
 *
 * This is what keeps the bot alive when the embedding call fails or the daily
 * OpenRouter quota is spent. Worse than vector search, but never a hard failure.
 */
export function lexicalTopK(query, k = TOP_K) {
    const chunks = searchableChunks();
    if (chunks.length === 0) return [];

    const qTerms = [...new Set(tokenize(query))];
    if (qTerms.length === 0) return [];

    const docTokens = chunks.map((c) => new Set(tokenize(`${c.title} ${c.text}`)));

    // IDF: rare terms in the query discriminate more than common ones.
    const idf = new Map();
    for (const term of qTerms) {
        const df = docTokens.reduce((n, set) => n + (set.has(term) ? 1 : 0), 0);
        idf.set(term, Math.log((chunks.length + 1) / (df + 1)) + 1);
    }

    return chunks
        .map((chunk, i) => {
            let score = 0;
            for (const term of qTerms) {
                if (docTokens[i].has(term)) score += idf.get(term);
            }
            // Normalise by query length so long questions aren't inflated.
            return { chunk, score: score / qTerms.length };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
}
