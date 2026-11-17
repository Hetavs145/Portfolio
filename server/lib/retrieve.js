/**
 * Query -> retrieved chunks -> answer.
 *
 * Two OpenRouter calls per message: one to embed the query, one to generate.
 * The corpus itself is never embedded at request time — its vectors are already
 * in index.json.
 */

import { embedOne, chat, stripMarkdown } from './openrouter.js';
import { parseTrailer, citedSources, StreamFilter } from './citations.js';
import {
    topK,
    lexicalTopK,
    loadIndex,
    allChunks,
    rareQueryTerms,
    chunkHasTerm,
} from './vectorstore.js';
import { buildSystemPrompt, sanitizeHistory } from './prompt.js';
import { parseIntent, recencyPins } from './recency.js';
import { hasContactIntent, contactChunks } from './actions.js';
import { hasHighlightIntent, highlightChunks, hasSelfIntent, selfChunks } from './intents.js';
import { TOP_K, MAX_HISTORY_TURNS, MAX_MESSAGE_CHARS, RECENCY_PINS } from './config.js';

/** Small LRU so repeated questions cost zero quota. */
const CACHE_MAX = 100;
const cache = new Map();

const cacheGet = (key) => {
    if (!cache.has(key)) return null;
    const val = cache.get(key);
    cache.delete(key); // re-insert to mark as recently used
    cache.set(key, val);
    return val;
};

const cacheSet = (key, val) => {
    cache.set(key, val);
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
};

/**
 * Reciprocal Rank Fusion. Merges ranked lists by position rather than by score,
 * which is the point: cosine scores here cluster in a narrow band (0.81-0.85 for
 * both the right answer and unrelated posts), so they can't be compared to
 * lexical IDF scores directly, and thresholding them is meaningless. Ranks are
 * comparable across both.
 */
function fuse(lists, { k = 20, entities = [] } = {}) {
    const scores = new Map();
    const chunks = new Map();

    for (const list of lists) {
        list.forEach(({ chunk }, rank) => {
            chunks.set(chunk.id, chunk);
            scores.set(chunk.id, (scores.get(chunk.id) ?? 0) + 1 / (k + rank + 1));
        });
    }

    // Entity gate. Fusion alone still lost "aetrix": dense scores here sit in a
    // narrow band, so a chunk merely present in both lists outranked the only
    // chunks that actually name the thing being asked about — and the bot denied
    // winning an award it won. A chunk containing a rare query term is about that
    // term, and that beats any amount of topical near-miss.
    if (entities.length) {
        for (const [id, score] of scores) {
            const chunk = chunks.get(id);
            const matched = entities.filter((term) => chunkHasTerm(chunk, term)).length;
            if (matched) scores.set(id, score + matched * ENTITY_BONUS);
        }
    }

    return [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id, score]) => ({ chunk: chunks.get(id), score }));
}

/** Comfortably larger than the spread of RRF scores, so an entity match wins. */
const ENTITY_BONUS = 0.05;

/** How deep each retriever goes before fusion. */
const CANDIDATES = 20;

/**
 * Hybrid similarity search: dense vectors plus lexical IDF, fused by rank.
 *
 * Vectors alone miss rare proper nouns — "is the IMNU resume your actual resume?"
 * ranked three unrelated LinkedIn posts above the chunk that answers it, because
 * every chunk embeds to roughly the same neighbourhood as a conversational
 * question. Lexical scoring nails exactly that case ("IMNU" is rare, so it
 * carries high IDF) and is hopeless at paraphrase, which vectors handle. Fusing
 * both is strictly better than either.
 *
 * Lexical also remains the sole fallback when the embedding API is down.
 */
async function similar(query, k) {
    const index = loadIndex({ quiet: true });
    const entities = rareQueryTerms(query);
    // Lexical goes deeper than the fusion window so an entity match that ranks
    // poorly on common words is still a candidate to be boosted.
    const lexical = lexicalTopK(query, CANDIDATES * 2);

    if (index?.vectorsUsable) {
        try {
            const vec = await embedOne(query);
            const dense = topK(vec, CANDIDATES);
            if (dense.length) {
                const hits = fuse([dense, lexical], { entities }).slice(0, k);
                return { hits, mode: entities.length ? 'hybrid+entity' : 'hybrid' };
            }
        } catch (err) {
            console.warn(`[retrieve] embedding failed, falling back to lexical: ${err.message}`);
        }
    }

    return { hits: lexical.slice(0, k), mode: 'lexical' };
}

/**
 * Retrieve context for a query — similarity, plus recency when the question is
 * about time.
 *
 * "What's your latest post?" is not a similarity question. Every post embeds to
 * roughly the same region, so top-k returned an arbitrary three and the model
 * invented a date to go with them. For temporal questions we therefore pin the
 * newest chunks of the relevant kind (and the pre-sorted timeline chunk) ahead
 * of the similarity hits, and let similarity fill the remaining slots.
 */
export async function retrieve(query, k = TOP_K) {
    const intent = parseIntent(query);
    const pins = intent.temporal ? recencyPins(intent, allChunks(), RECENCY_PINS) : [];
    // "How do I reach you?" shares few words with the block holding the email
    // and LinkedIn, so similarity alone misses it. Pin it for contact questions.
    const pin = (chunks) => {
        for (const chunk of chunks) {
            if (!pins.some((p) => p.chunk.id === chunk.id)) pins.push({ chunk, score: 1, pinned: true });
        }
    };
    if (hasContactIntent(query)) pin(contactChunks(allChunks()));
    // "Best project?" and "your portfolio?" share few words with the blocks
    // that answer them; see lib/intents.js.
    if (hasHighlightIntent(query)) pin(highlightChunks(allChunks()));
    if (hasSelfIntent(query)) pin(selfChunks(allChunks()));

    // Always leave room for similarity: a temporal question usually also has a
    // topic ("what did you post about RAG recently?").
    const slots = Math.max(k - pins.length, 2);
    const { hits, mode } = await similar(query, slots + pins.length);

    const pinnedIds = new Set(pins.map((p) => p.chunk.id));
    const rest = hits.filter((h) => !pinnedIds.has(h.chunk.id)).slice(0, slots);

    return {
        hits: [...pins, ...rest],
        mode: pins.length ? `${mode}+recency` : mode,
        temporal: intent.temporal,
    };
}

/** Pronouns that make a question meaningless on its own. */
const ANAPHORIC = /\b(that|it|this|those|these|there|then|him|them|the one)\b/i;

/**
 * The text actually sent to the retrievers.
 *
 * "What did you post before that?" retrieves nothing useful in isolation — "that"
 * carries the entire topic, and it lives in the previous turn. When the newest
 * message is short or leans on a pronoun, the preceding user turn is prepended so
 * the retrievers see what the question is actually about. The model still receives
 * the real conversation; only the search string is widened.
 */
function retrievalQuery(history, latest) {
    const needsContext = latest.content.length < 80 || ANAPHORIC.test(latest.content);
    if (!needsContext) return latest.content;

    const priorUser = [...history]
        .slice(0, -1)
        .reverse()
        .find((m) => m.role === 'user');

    return priorUser ? `${priorUser.content} ${latest.content}` : latest.content;
}

/**
 * Full RAG turn.
 *
 * Pass `onToken` to stream: the visible reply is forwarded as it's generated
 * (reasoning and the citation trailer filtered out), and the resolved result
 * carries the final cleaned message plus its sources.
 *
 * @param {{role: string, content: string}[]} messages conversation history, oldest first
 * @param {{onToken?: (text: string) => void}} [options]
 * @returns {Promise<{message: string, sources: object[], unanswered: boolean, retrieved: object[], mode: string, model: string, cached: boolean}>}
 */
export async function answer(messages, { onToken } = {}) {
    const history = sanitizeHistory(messages, MAX_HISTORY_TURNS, MAX_MESSAGE_CHARS);
    const latest = [...history].reverse().find((m) => m.role === 'user');
    if (!latest) throw new Error('No user message to answer');

    // Cache on the question plus the immediately preceding turn, so follow-ups
    // like "and that one?" aren't wrongly served a previous answer.
    const prior = history[history.length - 2]?.content ?? '';
    const cacheKey = `${prior} ${latest.content}`.toLowerCase().trim();

    const hit = cacheGet(cacheKey);
    if (hit) {
        onToken?.(hit.message);
        return { ...hit, cached: true };
    }

    const { hits, mode } = await retrieve(retrievalQuery(history, latest));
    const systemPrompt = buildSystemPrompt(hits);

    const filter = onToken ? new StreamFilter(onToken) : null;
    const { text: raw, model } = await chat(
        [{ role: 'system', content: systemPrompt }, ...history],
        filter ? { onToken: (t) => filter.push(t) } : {},
    );
    filter?.end();

    const { text, cited, unanswered } = parseTrailer(raw);

    const result = {
        message: stripMarkdown(text),
        // Chips for the visitor: the blocks the model says it used.
        sources: unanswered ? [] : citedSources(hits, cited, { answer: text, question: latest.content }),
        unanswered,
        // Everything retrieved, for debugging and the eval harness.
        retrieved: hits.map(({ chunk, score }) => ({
            id: chunk.id,
            source: chunk.source,
            title: chunk.title,
            score: Number(score.toFixed(4)),
        })),
        mode,
        model,
    };

    cacheSet(cacheKey, result);
    return { ...result, cached: false };
}
