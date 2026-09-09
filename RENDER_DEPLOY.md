# Deploy guide

Three places need configuration, and it matters which key goes where — putting the RapidAPI
key in Render does nothing, because the LinkedIn scrape runs in GitHub Actions, not on the
server.

| Where | What runs there | Keys it needs |
| --- | --- | --- |
| **Render** | `server/index.js` — the chat API | `NVIDIA_API_KEY`, `NVIDIA_EMBED_KEY` (or `OPENROUTER_API_KEY`), `ALLOWED_ORIGINS`, `SITE_URL` |
| **GitHub Actions** | daily knowledge-base refresh | `NVIDIA_API_KEY`, `NVIDIA_EMBED_KEY` (or `OPENROUTER_API_KEY`), `RAPIDAPI_KEY` |
| **Vercel** (or your static host) | the React site | `VITE_AGENT_API_URL` |

---

## 0. Rotate your keys first

The keys currently in `.env` were pasted into a chat transcript, so treat them as public.

1. Go to <https://openrouter.ai/keys>, delete the old keys, create two new ones.
2. Use the new values everywhere below. `.env` is gitignored (and `.env.*` now too), so
   nothing secret is committed either way — but a leaked key is a leaked key.

OpenRouter keys are **not** model-scoped: one key works for both embeddings and chat. The
reason for two is quota — pointing `OPENROUTER_EMBED_KEY` at a second account doubles your
free 50-requests/day allowance.

---

## 1. Render — the chat API

Render dashboard → your service → **Environment**:

```
OPENROUTER_API_KEY     = sk-or-v1-...        (new key)
OPENROUTER_EMBED_KEY   = sk-or-v1-...        (optional second key)
ALLOWED_ORIGINS        = https://portfolio.vaquah.in
SITE_URL               = https://portfolio.vaquah.in
```

Do **not** set `GROQ_API_KEY` — Groq has been removed entirely. If it's still there, delete it.

**Settings** → confirm:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |

`ALLOWED_ORIGINS` is the one that will bite you: leave it unset and the endpoint is open to
every origin on the internet, backed by your API key. Set wrong and your own site gets a 403.
Localhost origins are added automatically for development.

### Verify

```bash
curl https://<your-service>.onrender.com/
```

```json
{ "status": "ok", "retrieval": "vector", "chunks": 70, "indexBuiltAt": "..." }
```

`"retrieval": "vector"` is the thing to check. If it says `lexical (no index)`, then
`server/data/index.json` was not committed — run `npm run build:index` and push.

```bash
curl -X POST https://<your-service>.onrender.com/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"What is Kontexo?"}]}'
```

A correct answer mentions the MCP gateway, 19 tools and the 10-node LangGraph state machine.
If it answers vaguely, retrieval isn't reaching the resume chunk.

**Cold starts:** the free tier spins down after 15 minutes of no traffic and takes about a
minute to wake. The first message after a quiet period will feel slow. That's the platform,
not the agent.

---

## 2. GitHub Actions — the daily refresh

Repo → **Settings → Secrets and variables → Actions**.

Secrets:

```
OPENROUTER_API_KEY      (required — embeddings)
OPENROUTER_EMBED_KEY    (optional)
RAPIDAPI_KEY            (LinkedIn; omit and LinkedIn is skipped cleanly)
RAPIDAPI_KEY_FALLBACK   (optional second bucket)
```

Variables (not secrets):

```
LINKEDIN_PROFILE_URL = https://www.linkedin.com/in/hetav-shah-26601722b/
LINKEDIN_SOURCE      = rapidapi
```

Then **Actions → Refresh knowledge base → Run workflow** to test it once by hand.

The workflow scrapes posts daily and the full profile on Mondays, which keeps monthly
RapidAPI spend near 35 of the free 50 credits. It commits only when content actually
changed, and Render redeploys on that push.

### LinkedIn needs one manual step

The API this was built against relocated. Subscribe (free tier) to the new listing:

<https://rapidapi.com/pnd-team-pnd-team/api/professional-network-data>

Until you do, `refresh-linkedin.js` reports *"Not subscribed"*, keeps the last good snapshot,
and every other source keeps working. Nothing breaks — the bot just has no LinkedIn data.

If the provider moves again, set the `RAPIDAPI_HOST` repo variable to the new host instead of
changing code.

---

## 3. Frontend

Set `VITE_AGENT_API_URL` to your Render URL at build time. Empty means same-origin `/api/chat`,
which is right only if you deploy `api/chat.js` on Vercel instead of using Render.

This value is inlined into the client bundle, so it is public by design. It is not a secret.

---

## Updating the knowledge base by hand

```bash
npm run parse:resumes      # after editing either resume
npm run refresh:linkedin   # pull latest posts/certs
npm run build:index        # re-embed (~2 OpenRouter calls)
npm run check:links        # confirm no project links 404
git add server/data && git commit -m "chore: refresh knowledge base" && git push
```

The push is what deploys it — Render serves the committed `index.json`.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `"retrieval": "lexical (no index)"` | `server/data/index.json` not committed |
| `"lexical (index model mismatch)"` | index built with a different embedding model; re-run `build:index` |
| 403 from `/api/chat` | `ALLOWED_ORIGINS` doesn't include your site's origin |
| 503 "model pools are all busy" | every free model was rate-limited at once; transient, retry shortly |
| Answers are stale | the daily workflow hasn't run or is failing — check the Actions tab |
| `OPENROUTER_API_KEY not configured` | env var missing on Render |
