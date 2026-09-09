/**
 * Central configuration. Everything reads env; nothing here holds a secret value.
 *
 * OpenRouter keys are NOT model-scoped — one key works for both embeddings and chat.
 * The split exists so you can point embeddings at a second account and double the
 * free-tier quota (20 req/min, 50 req/day per account).
 */

export const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export const EMBED_MODEL = 'nvidia/nemotron-3-embed-1b:free';
export const CHAT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

/**
 * Free models are served from per-provider shared pools that saturate across ALL
 * OpenRouter free users — a 429 here usually means "Google's pool is busy right
 * now", not "you are out of quota". Observed in practice: both Gemma models 429
 * simultaneously while NVIDIA answered fine.
 *
 * So we fall through to models on *different* providers, in order. Ordering is
 * deliberate: the requested Gemma first, then NVIDIA, then back to Gemma's
 * smaller sibling as a last resort.
 */
const DEFAULT_CHAT_CHAIN = [
    CHAT_MODEL,
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'liquid/lfm-2.5-2.6b:free',
];

/**
 * Override with OPENROUTER_CHAT_MODELS (comma-separated) to change the chain
 * without a code edit — useful when a provider's free pool goes bad, and it
 * makes the fallback path testable in isolation.
 */
export const CHAT_FALLBACKS = (process.env.OPENROUTER_CHAT_MODELS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
    .length
    ? process.env.OPENROUTER_CHAT_MODELS.split(',').map((m) => m.trim()).filter(Boolean)
    : DEFAULT_CHAT_CHAIN;

export const chatKey = () => process.env.OPENROUTER_API_KEY || '';
export const embedKey = () =>
    process.env.OPENROUTER_EMBED_KEY || process.env.OPENROUTER_API_KEY || '';

// Sent as OpenRouter attribution headers; harmless if unset.
export const REFERER = process.env.SITE_URL || 'https://github.com/Hetavs145/Portfolio';
export const TITLE = 'Hetav Shah Portfolio Agent';

// Retrieval
export const TOP_K = 5;
export const EMBED_BATCH = 48; // texts per embeddings request — keeps the corpus to ~3 calls

// Generation
export const MAX_TOKENS = 400;
export const TEMPERATURE = 0.7;

// Request hygiene
export const REQUEST_TIMEOUT_MS = 25_000;
export const MAX_MESSAGE_CHARS = 1_000;
export const MAX_HISTORY_TURNS = 12;

// Rate limiting (per IP, in-memory)
export const RATE_PER_MINUTE = 10;
export const RATE_PER_DAY = 40;

/**
 * Origins allowed to call /api/chat. Comma-separated env, plus localhost for dev.
 * An empty ALLOWED_ORIGINS means "allow all" so a fresh clone still works.
 */
export function allowedOrigins() {
    const raw = (process.env.ALLOWED_ORIGINS || '').trim();
    if (!raw) return null; // null = allow all
    return raw
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
        .concat(['http://localhost:5173', 'http://localhost:4173']);
}
