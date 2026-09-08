/**
 * OpenRouter client — the only LLM provider in this project.
 *
 * Two endpoints are used:
 *   POST /embeddings       nvidia/nemotron-3-embed-1b:free  (batched, array input)
 *   POST /chat/completions google/gemma-4-31b-it:free
 */

import {
    OPENROUTER_BASE,
    EMBED_MODEL,
    CHAT_MODEL,
    CHAT_FALLBACKS,
    chatKey,
    embedKey,
    REFERER,
    TITLE,
    EMBED_BATCH,
    MAX_TOKENS,
    TEMPERATURE,
    REQUEST_TIMEOUT_MS,
} from './config.js';

function headers(key) {
    return {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': REFERER,
        'X-Title': TITLE,
    };
}

/** fetch with an abort timeout, so a hung upstream can't pin a request open. */
async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Free-tier models return 429 under the 20 req/min cap. Retry a couple of times
 * with backoff before giving up — callers treat a throw as "fall back to lexical".
 */
async function withRetry(fn, { attempts = 3, baseDelayMs = 1200 } = {}) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            if (!err.retryable || i === attempts - 1) throw err;
            await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
        }
    }
    throw lastErr;
}

function apiError(status, body) {
    const err = new Error(`OpenRouter ${status}: ${String(body).slice(0, 300)}`);
    err.status = status;
    // 429 = rate limited, 5xx = upstream blip. Both worth retrying.
    err.retryable = status === 429 || status >= 500;
    return err;
}

/**
 * Embed an array of strings. Returns number[][] aligned to the input order.
 *
 * Batched at EMBED_BATCH per request — the whole ~120-chunk corpus costs ~3 calls
 * rather than 120, which is what keeps an index build inside the 50/day free cap.
 */
export async function embed(texts) {
    const key = embedKey();
    if (!key) throw new Error('OPENROUTER_API_KEY (or OPENROUTER_EMBED_KEY) is not set');

    const inputs = Array.isArray(texts) ? texts : [texts];
    if (inputs.length === 0) return [];

    const out = [];
    for (let i = 0; i < inputs.length; i += EMBED_BATCH) {
        const batch = inputs.slice(i, i + EMBED_BATCH);

        const vectors = await withRetry(async () => {
            const res = await fetchWithTimeout(`${OPENROUTER_BASE}/embeddings`, {
                method: 'POST',
                headers: headers(key),
                body: JSON.stringify({
                    model: EMBED_MODEL,
                    input: batch,
                    encoding_format: 'float',
                }),
            });

            if (!res.ok) throw apiError(res.status, await res.text());

            const json = await res.json();
            if (!Array.isArray(json.data)) {
                throw new Error('OpenRouter embeddings: unexpected response shape');
            }
            // The API may return results out of order; `index` is authoritative.
            return json.data
                .slice()
                .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
                .map((d) => d.embedding);
        });

        out.push(...vectors);
    }

    if (out.length !== inputs.length) {
        throw new Error(`Embedding count mismatch: got ${out.length}, expected ${inputs.length}`);
    }
    return out;
}

/** Embed a single string; convenience wrapper used on the query path. */
export async function embedOne(text) {
    const [vec] = await embed([text]);
    return vec;
}

/**
 * The chat UI renders plain text, and the persona forbids markdown — but the
 * fallback models are less obedient about that than Gemma. Strip the common
 * markers rather than shipping literal ** and ### to the page.
 */
function stripMarkdown(text) {
    return text
        .replace(/```[\w]*\n?([\s\S]*?)```/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/(^|\s)\*([^*\n]+)\*/g, '$1$2')
        .replace(/(^|\s)_([^_\n]+)_/g, '$1$2')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/‑/g, '-') // non-breaking hyphens the models like to emit
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** Thrown when a model rejects `reasoning: { enabled: false }` outright. */
const REASONING_REQUIRED = /reasoning is mandatory|cannot be disabled/i;

async function completeWith(model, messages, key, maxTokens, temperature, { disableReasoning }) {
    const body = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 0.9,
    };
    // Several models in the chain are reasoning models. Left enabled they can
    // spend the whole token budget thinking and return empty content — which is
    // what nemotron-3-super and nemotron-3-nano-omni both did in testing.
    if (disableReasoning) body.reasoning = { enabled: false };

    const res = await fetchWithTimeout(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: headers(key),
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        // liquid/lfm-2.5-2.6b:free rejects the flag with a 400. That is a
        // retryable-with-different-args condition, not a dead model.
        if (res.status === 400 && disableReasoning && REASONING_REQUIRED.test(text)) {
            const err = new Error(`${model} requires reasoning`);
            err.needsReasoning = true;
            throw err;
        }
        throw apiError(res.status, text);
    }

    const json = await res.json();
    const msg = json.choices?.[0]?.message ?? {};

    // Deliberately NOT falling back to msg.reasoning: that is the model's
    // chain-of-thought, and returning it verbatim showed visitors things like
    // "The user wants me to reply with just OK. This is..." An empty content
    // field means this attempt failed — retry with more room, or move on.
    const content = msg.content || '';

    if (!content.trim()) {
        const err = new Error(`OpenRouter chat (${model}): empty completion`);
        err.emptyCompletion = true;
        err.status = 502; // so the chain moves on if the retry also comes back empty
        throw err;
    }
    return stripMarkdown(content);
}

/**
 * Chat completion with cross-provider fallback.
 *
 * `messages` is the full OpenAI-shaped array including the system turn.
 * Returns { text, model } so callers can report which model actually answered.
 *
 * A 429 on a :free model is normally the provider's *shared pool* being busy,
 * not your key being out of quota — so we move to a model on another provider
 * rather than giving up. Only if every model in the chain fails do we throw.
 */
export async function chat(messages, { maxTokens = MAX_TOKENS, temperature = TEMPERATURE } = {}) {
    const key = chatKey();
    if (!key) throw new Error('OPENROUTER_API_KEY is not set');

    let lastErr;
    for (const model of CHAT_FALLBACKS) {
        // Attempt 1: reasoning off, normal budget.
        // Attempt 2 (only if the model demands reasoning, or returned nothing):
        // reasoning on, with a much larger budget so it can think AND still emit
        // an answer — the whole reason attempt 1 came back empty.
        for (const attempt of [
            { disableReasoning: true, tokens: maxTokens },
            { disableReasoning: false, tokens: maxTokens * 4 },
        ]) {
            try {
                // No in-place retry on 429: a saturated shared pool won't clear in
                // a second, so switching provider is faster and likelier to work.
                const text = await completeWith(
                    model,
                    messages,
                    key,
                    attempt.tokens,
                    temperature,
                    { disableReasoning: attempt.disableReasoning },
                );
                return { text, model };
            } catch (err) {
                lastErr = err;

                // Worth immediately retrying the SAME model with reasoning on.
                if (attempt.disableReasoning && (err.needsReasoning || err.emptyCompletion)) {
                    console.warn(`[openrouter] ${model}: retrying with reasoning enabled`);
                    continue;
                }

                // 403 = model not available to this account (agentic-harness-only).
                if (err.status === 429 || err.status === 403 || err.status >= 500) {
                    console.warn(`[openrouter] ${model} unavailable (${err.status}), trying next`);
                    break; // next model
                }

                // 400/401 with no known remedy is our bug or a bad key.
                throw err;
            }
        }
    }
    throw lastErr;
}
