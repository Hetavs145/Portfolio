/**
 * Client for LLM and Embeddings — supports NVIDIA NIM (https://integrate.api.nvidia.com/v1)
 * and OpenRouter (https://openrouter.ai/api/v1).
 *
 * Primary provider: NVIDIA NIM (direct fast inference)
 * Backup provider:  OpenRouter (used automatically as fallback if NVIDIA NIM keys get rate-limited)
 */

import {
    NVIDIA_BASE,
    OPENROUTER_BASE,
    NVIDIA_EMBED_MODEL,
    OPENROUTER_EMBED_MODEL,
    NVIDIA_CHAT_MODELS,
    OPENROUTER_CHAT_MODELS,
    nvidiaChatKey,
    nvidiaEmbedKey,
    openrouterChatKey,
    openrouterEmbedKey,
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

async function embedWithProvider(texts, { baseUrl, key, model, providerName }) {
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

            if (!res.ok) throw apiError(res.status, await res.text(), providerName);

            const json = await res.json();
            if (!Array.isArray(json.data)) {
                throw new Error(providerName + " embeddings: unexpected response shape");
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

export async function embed(texts) {
    const nvKey = nvidiaEmbedKey();
    const orKey = openrouterEmbedKey();

    if (!nvKey && !orKey) {
        throw new Error("Neither NVIDIA_EMBED_KEY/NVIDIA_API_KEY nor OPENROUTER_API_KEY is set");
    }

    // 1. Primary: NVIDIA NIM embeddings
    if (nvKey) {
        try {
            return await embedWithProvider(texts, {
                baseUrl: NVIDIA_BASE,
                key: nvKey,
                model: NVIDIA_EMBED_MODEL.replace(/:free$/, ""),
                providerName: "NVIDIA",
            });
        } catch (err) {
            if (!orKey) throw err;
            console.warn(
                `[embed] NVIDIA NIM embeddings failed (${err.status || err.message}), falling back to backup OpenRouter key...`
            );
        }
    }

    // 2. Backup: OpenRouter embeddings
    if (orKey) {
        return await embedWithProvider(texts, {
            baseUrl: OPENROUTER_BASE,
            key: orKey,
            model: OPENROUTER_EMBED_MODEL,
            providerName: "OpenRouter",
        });
    }
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

async function completeWith(model, messages, key, maxTokens, temperature, { disableReasoning, baseUrl, providerName }) {
    const actualModel = providerName === "NVIDIA" ? model.replace(/:free$/, "") : model;

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
        throw apiError(res.status, text, providerName);
    }

    const json = await res.json();
    const msg = json.choices?.[0]?.message ?? {};
    const content = msg.content || "";

    if (!content.trim()) {
        const err = new Error(providerName + " chat (" + actualModel + "): empty completion");
        err.emptyCompletion = true;
        err.status = 502;
        throw err;
    }
    return stripMarkdown(content);
}

async function tryChatChain({ providerName, baseUrl, key, models, messages, maxTokens, temperature }) {
    let lastErr;
    for (const model of models) {
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
                    { disableReasoning: attempt.disableReasoning, baseUrl, providerName },
                );
                return {
                    text,
                    model: providerName === "NVIDIA" ? model.replace(/:free$/, "") : model,
                    provider: providerName,
                };
            } catch (err) {
                lastErr = err;
                if (attempt.disableReasoning && (err.needsReasoning || err.emptyCompletion)) {
                    console.warn(`[${providerName.toLowerCase()}] ${model}: retrying with reasoning enabled`);
                    continue;
                }
                if (err.status === 429 || err.status === 403 || err.status === 404 || err.status >= 500) {
                    console.warn(`[${providerName.toLowerCase()}] ${model} unavailable (${err.status}), trying next`);
                    break;
                }
                throw err;
            }
        }
    }
    throw lastErr;
}

export async function chat(messages, { maxTokens = MAX_TOKENS, temperature = TEMPERATURE } = {}) {
    const nvKey = nvidiaChatKey();
    const orKey = openrouterChatKey();

    if (!nvKey && !orKey) {
        throw new Error("Neither NVIDIA_API_KEY nor OPENROUTER_API_KEY is set");
    }

    let lastErr;

    // 1. Primary: NVIDIA NIM
    if (nvKey) {
        try {
            return await tryChatChain({
                providerName: "NVIDIA",
                baseUrl: NVIDIA_BASE,
                key: nvKey,
                models: NVIDIA_CHAT_MODELS,
                messages,
                maxTokens,
                temperature,
            });
        } catch (err) {
            lastErr = err;
            if (!orKey) throw err;
            console.warn(
                `[chat] NVIDIA NIM models unavailable or rate-limited (${err.status || err.message}). Falling back to backup OpenRouter key...`
            );
        }
    }

    // 2. Backup / Fallback: OpenRouter
    if (orKey) {
        try {
            return await tryChatChain({
                providerName: "OpenRouter",
                baseUrl: OPENROUTER_BASE,
                key: orKey,
                models: OPENROUTER_CHAT_MODELS,
                messages,
                maxTokens,
                temperature,
            });
        } catch (err) {
            lastErr = err;
            throw err;
        }
    }

    throw lastErr;
}
