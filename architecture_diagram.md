# Portfolio RAG Agent — Architecture

The chatbot on this site is a real retrieval-augmented generation pipeline: the corpus is
chunked and embedded ahead of time, and each question is answered from the chunks that
actually match it — not from a fixed blob of text stuffed into every prompt.

Everything runs on **OpenRouter free-tier models**, at zero cost.

## Build time — the knowledge base

```mermaid
flowchart TD
    subgraph SOURCES["Sources"]
        TEX["Hetav_Shah_Resume.tex"]
        DOCX["23BTM026_Hetav Shah.docx<br/>(IMNU resume)"]
        GH["GitHub REST API<br/>public, unauthenticated"]
        LI["LinkedIn<br/>RapidAPI / DMA / CSV export"]
        SITE["src/data/*.js<br/>projects · achievements · profile"]
    end

    TEX --> PARSE["parse-resumes.js"]
    DOCX --> PARSE
    PARSE --> RJSON["data/resume.json<br/>data/resume-imnu.json"]

    LI --> LIREF["refresh-linkedin.js<br/>cascade + last-good fallback"]
    LIREF --> LJSON["data/linkedin.json"]

    RJSON --> CHUNK["chunk.js<br/>~900 chars, sentence-aligned"]
    GH --> CHUNK
    LJSON --> CHUNK
    SITE --> CHUNK

    CHUNK --> EMBED["OpenRouter /embeddings<br/>nvidia/nemotron-3-embed-1b:free<br/>batched 48/call → ~2 calls total"]
    EMBED --> INDEX[("data/index.json<br/>70 chunks · 2048-dim<br/>committed to git")]

    style INDEX fill:#0a192f,stroke:#64ffda,color:#ccd6f6
    style EMBED fill:#112240,stroke:#64ffda,color:#ccd6f6
```

The index is **precomputed and committed**. Not because vectors are cheap to store, but
because neither free host can cache one it built: Render's filesystem is ephemeral and the
service spins down after 15 minutes idle, and Vercel functions are read-only with no warm
state. Building at boot would re-embed the whole corpus on every cold start and exhaust the
50-requests/day free quota before a visitor ever asked anything. Reading a committed file is
the one thing both platforms do well.

## Request time — answering a question

```mermaid
flowchart TD
    USER["Visitor types a question<br/>RealTimeDemo.jsx"] --> API["POST /api/chat"]

    API --> GUARD{"Origin allowed?<br/>Under rate limit?<br/>Under 1000 chars?"}
    GUARD -- no --> REJECT["403 / 429 / 400"]
    GUARD -- yes --> CACHE{"In LRU cache?"}

    CACHE -- hit --> OUT
    CACHE -- miss --> QEMBED["Embed the query<br/>1 OpenRouter call"]

    QEMBED -- ok --> COSINE["Cosine similarity<br/>top-5 of 70 chunks<br/>in-process, no network"]
    QEMBED -- "fails / quota spent" --> LEX["Lexical fallback<br/>IDF term overlap<br/>same chunks, no API"]

    COSINE --> PROMPT
    LEX --> PROMPT["Build system prompt<br/>persona + labelled chunks"]

    PROMPT --> CHAT["OpenRouter /chat/completions"]

    CHAT --> M1["google/gemma-4-31b-it:free"]
    M1 -- "429 pool busy" --> M2["nvidia/nemotron-3-super-120b"]
    M2 -- "429" --> M3["nvidia/nemotron-3.5-lightning"]
    M3 -- "429" --> M4["google/gemma-4-26b-a4b-it"]

    M1 --> OUT["{ message, sources[], mode, model }"]
    M2 --> OUT
    M3 --> OUT
    M4 --> OUT

    style LEX fill:#112240,stroke:#f59e0b,color:#ccd6f6
    style OUT fill:#0a192f,stroke:#64ffda,color:#ccd6f6
```

Two OpenRouter calls per message: one to embed the query, one to generate. The corpus is
never re-embedded at request time.

**Two independent fallbacks keep it alive.** If embedding fails, retrieval degrades to
lexical scoring over the same chunks rather than going down. If a chat model returns 429 —
which on free tiers usually means that *provider's shared pool* is busy, not that your key is
out of quota — it moves to a model on a different provider. Both Gemma models were observed
rate-limited simultaneously while NVIDIA answered fine.

## Staying current

```mermaid
flowchart LR
    CRON["GitHub Actions<br/>daily 03:00 UTC"] --> LI["refresh LinkedIn<br/>posts daily · profile weekly"]
    LI --> GH["re-scrape GitHub repos"]
    GH --> BUILD["rebuild + re-embed"]
    BUILD --> DIFF{"index changed?"}
    DIFF -- no --> STOP["no commit"]
    DIFF -- yes --> COMMIT["commit index.json"]
    COMMIT --> DEPLOY["Render auto-deploys"]

    style DEPLOY fill:#0a192f,stroke:#64ffda,color:#ccd6f6
```

The repo is public, so Actions minutes are free and unlimited. Post something on LinkedIn or
push a new repo, and the bot can discuss it within a day with no manual step.

## Deployment

| Piece | Runs on | Needs |
| --- | --- | --- |
| Static site | Vercel / any static host | `VITE_AGENT_API_URL` |
| `server/index.js` | Render (free tier) | `OPENROUTER_API_KEY`, `ALLOWED_ORIGINS` |
| `api/chat.js` | Vercel functions (alternative) | same |
| Knowledge refresh | GitHub Actions | `OPENROUTER_API_KEY`, `RAPIDAPI_KEY` |

`server/index.js` and `api/chat.js` are both thin wrappers over `server/lib/` — the same
retrieval, prompt and client code, so the two entry points cannot drift apart.
