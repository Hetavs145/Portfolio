/**
 * Chunking helpers. Every source module produces chunks through `makeChunk`, so
 * the index has one consistent shape:
 *
 *   { id, source, title, text }
 *
 * `source` labels where a fact came from ("resume", "github", "linkedin", "site")
 * and is surfaced to the model so it can say *how* it knows something.
 *
 * Chunks may also carry optional metadata:
 *
 *   { date: 'YYYY-MM-DD', kind: 'post' | 'repo' | 'commit' | ..., url }
 *
 * `date` is what makes "what's your latest post?" answerable. Cosine similarity
 * has no notion of time — every post looks equally "recent" to an embedding — so
 * recency has to travel as structured metadata, not as prose the model must
 * notice. See lib/recency.js.
 */

/** Chunks are kept small — one fact each — so top-5 retrieval stays precise. */
const MAX_CHARS = 900;
const OVERLAP = 120;

const slug = (s) =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60);

/** Keep only the metadata keys we understand, and drop empty values. */
function pruneMeta(meta) {
    const out = {};
    for (const key of ['date', 'kind', 'url']) {
        const value = meta?.[key];
        if (value != null && value !== '') out[key] = value;
    }
    return out;
}

export function makeChunk(source, title, text, meta = {}) {
    const clean = String(text).replace(/\s+/g, ' ').trim();
    return {
        id: `${source}:${slug(title)}`,
        source,
        title: String(title).trim(),
        text: clean,
        ...pruneMeta(meta),
    };
}

/**
 * Split text that exceeds MAX_CHARS on sentence boundaries, with a little overlap
 * so a fact spanning a split is still retrievable from either half.
 */
export function splitLong(source, title, text, meta = {}) {
    const clean = String(text).replace(/\s+/g, ' ').trim();
    if (clean.length <= MAX_CHARS) return [makeChunk(source, title, clean, meta)];

    const sentences = clean.match(/[^.!?]+[.!?]*/g) || [clean];
    const parts = [];
    let buf = '';

    for (const sentence of sentences) {
        if (buf.length + sentence.length > MAX_CHARS && buf) {
            parts.push(buf.trim());
            buf = buf.slice(-OVERLAP) + sentence;
        } else {
            buf += sentence;
        }
    }
    if (buf.trim()) parts.push(buf.trim());

    // Metadata is copied onto every part. A post split into three pieces used to
    // leave its date on the final fragment only, so retrieving fragment 1 gave the
    // model undated text and it would confidently invent a date.
    return parts.map((part, i) =>
        makeChunk(source, `${title} (${i + 1}/${parts.length})`, part, meta),
    );
}

/**
 * Chunk ids must be unique — duplicates would let one fact crowd out another in
 * top-k. Suffix any collisions rather than silently dropping them.
 */
export function dedupeIds(chunks) {
    const seen = new Map();
    return chunks.map((c) => {
        const n = seen.get(c.id) ?? 0;
        seen.set(c.id, n + 1);
        return n === 0 ? c : { ...c, id: `${c.id}-${n + 1}` };
    });
}
