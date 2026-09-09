/**
 * Central configuration. Everything reads env; nothing here holds a secret value.
 *
 * Supports both NVIDIA NIM direct API (https://integrate.api.nvidia.com/v1)
 * and OpenRouter (https://openrouter.ai/api/v1).
 */

export const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";
export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export const nvidiaChatKey = () => process.env.NVIDIA_API_KEY || "";
export const nvidiaEmbedKey = () =>
    process.env.NVIDIA_EMBED_KEY || process.env.NVIDIA_API_KEY || "";
export const openrouterChatKey = () => process.env.OPENROUTER_API_KEY || "";
export const openrouterEmbedKey = () =>
    process.env.OPENROUTER_EMBED_KEY || process.env.OPENROUTER_API_KEY || "";

export const isNvidiaChat = () => Boolean(nvidiaChatKey());
export const isNvidiaEmbed = () => Boolean(nvidiaEmbedKey());

export const chatKey = () => nvidiaChatKey() || openrouterChatKey();
export const embedKey = () => nvidiaEmbedKey() || openrouterEmbedKey();

export const EMBED_MODEL =
    process.env.EMBED_MODEL ||
    (isNvidiaEmbed() ? "nvidia/nemotron-3-embed-1b" : "nvidia/nemotron-3-embed-1b:free");

export const CHAT_MODEL =
    process.env.CHAT_MODEL ||
    (isNvidiaChat()
        ? "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
        : "meta-llama/llama-3.3-70b-instruct:free");

const DEFAULT_NVIDIA_CHAT_CHAIN = [
    CHAT_MODEL,
    "nvidia/nemotron-3-super-120b-a12b",
    "meta/llama-3.2-11b-vision-instruct",
    "nvidia/nemotron-3.5-lightning-30b-a3b",
];

const DEFAULT_OPENROUTER_CHAT_CHAIN = [
    CHAT_MODEL,
    "meta-llama/llama-3.3-70b-instruct:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "google/gemma-4-31b-it:free",
];

const DEFAULT_CHAT_CHAIN = isNvidiaChat()
    ? DEFAULT_NVIDIA_CHAT_CHAIN
    : DEFAULT_OPENROUTER_CHAT_CHAIN;

export const CHAT_FALLBACKS = (
    process.env.NVIDIA_CHAT_MODELS ||
    process.env.OPENROUTER_CHAT_MODELS ||
    ""
)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean).length
    ? (process.env.NVIDIA_CHAT_MODELS || process.env.OPENROUTER_CHAT_MODELS)
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean)
    : DEFAULT_CHAT_CHAIN;

// Attribution headers for OpenRouter / clients
export const REFERER = process.env.SITE_URL || "https://github.com/Hetavs145/Portfolio";
export const TITLE = "Hetav Shah Portfolio Agent";

// Retrieval
export const TOP_K = 6;
// How many of TOP_K a temporal question ("latest post?") may spend on
// newest-first pins before similarity fills the rest.
export const RECENCY_PINS = 3;
export const EMBED_BATCH = 48; // texts per embeddings request

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
 */
export function allowedOrigins() {
    const raw = (process.env.ALLOWED_ORIGINS || "").trim();
    if (!raw) return null; // null = allow all
    return raw
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
        .concat(["http://localhost:5173", "http://localhost:4173"]);
}
