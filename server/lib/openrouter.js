/**
 * Client for LLM and Embeddings — supports NVIDIA NIM (https://integrate.api.nvidia.com/v1)
 * and OpenRouter (https://openrouter.ai/api/v1).
 */

import {
    NVIDIA_BASE,
    OPENROUTER_BASE,
    EMBED_MODEL,
    CHAT_FALLBACKS,
    chatKey,
    embedKey,
    isNvidiaChat,
    isNvidiaEmbed,
    REFERER,
    TITLE,
    EMBED_BATCH,
    MAX_TOKENS,
    TEMPERATURE,
    REQUEST_TIMEOUT_MS,
} from "./config.js";

function headers(key) {
    return {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        "HTTP-Referer": REFERER,
        "X-Title": TITLE,
    };
}

async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

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

function apiError(status, body, provider = "API") {
    const err = new Error(provider + " " + status + ": " + String(body).slice(0, 300));
    err.status = status;
    err.retryable = status === 429 || status >= 500;
    return err;
}

export async function embed(texts) {
    const isNv = isNvidiaEmbed();
    const key = embedKey();
    if (!key) throw new Error("NVIDIA_EMBED_KEY or OPENROUTER_API_KEY is not set");

    const baseUrl = isNv ? NVIDIA_BASE : OPENROUTER_BASE;
    const model = isNv ? EMBED_MODEL.replace(/:free$/, "") : EMBED_MODEL;

    const inputs = Array.isArray(texts) ? texts : [texts];
    if (inputs.length === 0) return [];

    const out = [];
    for (let i = 0; i < inputs.length; i += EMBED_BATCH) {
        const batch = inputs.slice(i, i + EMBED_BATCH);
        const vectors = await withRetry(async () => {
            const res = await fetchWithTimeout(baseUrl + "/embeddings", {
                method: "POST",
                headers: headers(key),
                body: JSON.stringify({
                    model,
                    input: batch,
                    encoding_format: "float",
                }),
            });

            if (!res.ok) throw apiError(res.status, await res.text(), isNv ? "NVIDIA" : "OpenRouter");

            const json = await res.json();
            if (!Array.isArray(json.data)) {
                throw new Error((isNv ? "NVIDIA" : "OpenRouter") + " embeddings: unexpected response shape");
            }
            return json.data
                .slice()
                .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
                .map((d) => d.embedding);
        });
        out.push(...vectors);
    }
    if (out.length !== inputs.length) {
        throw new Error("Embedding count mismatch: got " + out.length + ", expected " + inputs.length);
    }
    return out;
}

export async function embedOne(text) {
    const [vec] = await embed([text]);
    return vec;
}

function stripMarkdown(text) {
    return text
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/(^|\s)\*([^\*\n]+)\*/g, "$1$2")
        .replace(/(^|\s)_([^_\n]+)_/g, "$1$2")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^\s*[-*+]\s+/gm, "")
        .replace(/‑/g, "-")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

const REASONING_REQUIRED = /reasoning is mandatory|cannot be disabled/i;

async function completeWith(model, messages, key, maxTokens, temperature, { disableReasoning, isNv }) {
    const baseUrl = isNv ? NVIDIA_BASE : OPENROUTER_BASE;
    const actualModel = isNv ? model.replace(/:free$/, "") : model;

    const body = {
        model: actualModel,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 0.9,
    };
    if (disableReasoning) body.reasoning = { enabled: false };

    const res = await fetchWithTimeout(baseUrl + "/chat/completions", {
        method: "POST",
        headers: headers(key),
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        if (res.status === 400 && disableReasoning && REASONING_REQUIRED.test(text)) {
            const err = new Error(actualModel + " requires reasoning");
            err.needsReasoning = true;
            throw err;
        }
        throw apiError(res.status, text, isNv ? "NVIDIA" : "OpenRouter");
    }

    const json = await res.json();
    const msg = json.choices?.[0]?.message ?? {};
    const content = msg.content || "";

    if (!content.trim()) {
        const err = new Error((isNv ? "NVIDIA" : "OpenRouter") + " chat (" + actualModel + "): empty completion");
        err.emptyCompletion = true;
        err.status = 502;
        throw err;
    }
    return stripMarkdown(content);
}

export async function chat(messages, { maxTokens = MAX_TOKENS, temperature = TEMPERATURE } = {}) {
    const isNv = isNvidiaChat();
    const key = chatKey();
    if (!key) throw new Error("NVIDIA_API_KEY (or OPENROUTER_API_KEY) is not set");

    let lastErr;
    for (const model of CHAT_FALLBACKS) {
        for (const attempt of [
            { disableReasoning: true, tokens: maxTokens },
            { disableReasoning: false, tokens: maxTokens * 4 },
        ]) {
            try {
                const text = await completeWith(
                    model,
                    messages,
                    key,
                    attempt.tokens,
                    temperature,
                    { disableReasoning: attempt.disableReasoning, isNv },
                );
                return { text, model: isNv ? model.replace(/:free$/, "") : model };
            } catch (err) {
                lastErr = err;
                if (attempt.disableReasoning && (err.needsReasoning || err.emptyCompletion)) {
                    console.warn("[" + (isNv ? "nvidia" : "openrouter") + "] " + model + ": retrying with reasoning enabled");
                    continue;
                }
                if (err.status === 429 || err.status === 403 || err.status === 404 || err.status >= 500) {
                    console.warn("[" + (isNv ? "nvidia" : "openrouter") + "] " + model + " unavailable (" + err.status + "), trying next");
                    break;
                }
                throw err;
            }
        }
    }
    throw lastErr;
}
