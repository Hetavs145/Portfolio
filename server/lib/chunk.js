/**
 * Chunking helpers. Every source module produces chunks through `makeChunk`, so
 * the index has one consistent shape:
 *
 *   { id, source, title, text }
 *
 * `source` labels where a fact came from ("resume", "github", "linkedin", "site")
 * and is surfaced to the model so it can say *how* it knows something.
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

export function makeChunk(source, title, text) {
    const clean = String(text).replace(/\s+/g, ' ').trim();
    return {
        id: `${source}:${slug(title)}`,
        source,
        title: String(title).trim(),
        text: clean,
    };
}

/**
 * Split text that exceeds MAX_CHARS on sentence boundaries, with a little overlap
 * so a fact spanning a split is still retrievable from either half.
 */
export function splitLong(source, title, text) {
    const clean = String(text).replace(/\s+/g, ' ').trim();
    if (clean.length <= MAX_CHARS) return [makeChunk(source, title, clean)];

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

    return parts.map((part, i) => {
        const chunk = makeChunk(source, `${title} (${i + 1}/${parts.length})`, part);
        return chunk;
    });
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
