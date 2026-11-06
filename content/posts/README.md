# Posts

Write a LinkedIn post here first, then share it on LinkedIn. The portfolio's
chatbot learns it as soon as you push — no scraping, no API credits.

One file per post, named `YYYY-MM-DD-short-title.md`:

```markdown
---
date: 2026-11-06
linkedin: https://www.linkedin.com/posts/...   # optional — add once it's live
---
The post text, exactly as it goes out on LinkedIn.
```

- Add `draft: true` to keep a post out of the bot until it's published.
- If you forget the `linkedin:` link, nothing breaks: when the nightly scrape
  sees the LinkedIn copy, the two are merged by date and opening words instead
  of being counted twice.
- Pushing to `main` with a change in this folder rebuilds the knowledge base
  (see `.github/workflows/refresh-kb.yml`).

For your profile (headline, experience, skills, certifications), import
LinkedIn's official data export every few months:

```bash
npm run import:linkedin -- ~/Downloads/Basic_LinkedInDataExport.zip
```

Only the profile and post CSVs are copied; messages, connections and emails in
the archive never leave your machine.
