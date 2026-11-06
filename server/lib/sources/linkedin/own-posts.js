/**
 * Posts written in this repo first, then shared to LinkedIn ("publish on your
 * own site, syndicate elsewhere").
 *
 * Each post is a markdown file in content/posts/:
 *
 *   ---
 *   date: 2026-11-06
 *   linkedin: https://www.linkedin.com/posts/...   (optional — add once shared)
 *   ---
 *   The post text, exactly as it goes out on LinkedIn.
 *
 * Nothing is scraped: pushing a new file triggers the knowledge-base rebuild, so
 * the bot knows about a post minutes after it's written, for free. When the
 * scraper later picks up the LinkedIn copy, the two are merged (see
 * mergeOwnPosts) rather than counted twice.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const POSTS_DIR = path.join(HERE, '..', '..', '..', '..', 'content', 'posts');

/** Minimal frontmatter parser: `key: value` lines between --- fences. */
function parse(raw) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
    if (!m) return { meta: {}, body: raw.trim() };
    const meta = {};
    for (const line of m[1].split(/\r?\n/)) {
        const kv = /^([A-Za-z_]+)\s*:\s*(.*)$/.exec(line.trim());
        if (kv) meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g, '');
    }
    return { meta, body: m[2].trim() };
}

/** Posts from content/posts/*.md, shaped like the adapters' posts. Skips README and drafts. */
export function readOwnPosts() {
    if (!fs.existsSync(POSTS_DIR)) return [];
    return fs
        .readdirSync(POSTS_DIR)
        .filter((f) => f.endsWith('.md') && !/^readme\.md$/i.test(f))
        .map((f) => {
            const { meta, body } = parse(fs.readFileSync(path.join(POSTS_DIR, f), 'utf8'));
            // Filename fallback: 2026-11-06-some-title.md
            const date = meta.date || /^(\d{4}-\d{2}-\d{2})/.exec(f)?.[1] || null;
            return { meta, body, date };
        })
        .filter(({ meta, body, date }) => body && date && meta.draft !== 'true')
        .map(({ meta, body, date }) => ({
            text: body,
            postedAt: date,
            url: meta.linkedin || null,
            origin: 'repo',
        }));
}

/** Plain, comparable text: folds LinkedIn's "math bold" letters, drops punctuation. */
const fingerprint = (text) =>
    String(text ?? '')
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .slice(0, 60);

const dayDiff = (a, b) => Math.abs(Date.parse(a.slice(0, 10)) - Date.parse(b.slice(0, 10))) / 86400_000;

/**
 * Merge repo-authored posts into the scraped/exported list.
 *
 * A repo post and its LinkedIn copy are the same post when they share a URL,
 * or — before the URL has been added to the frontmatter — when they were posted
 * within a day of each other and open with the same words. The LinkedIn copy is
 * kept (it has the real permalink and timestamp); a repo post only adds what
 * LinkedIn doesn't have yet.
 */
export function mergeOwnPosts(posts, own) {
    const out = [...(posts ?? [])];
    for (const mine of own) {
        const twin = out.find(
            (p) =>
                (mine.url && p.url && p.url === mine.url) ||
                (p.postedAt &&
                    mine.postedAt &&
                    dayDiff(String(p.postedAt), String(mine.postedAt)) <= 1 &&
                    fingerprint(p.text) &&
                    fingerprint(p.text) === fingerprint(mine.text)),
        );
        if (!twin) out.push(mine);
        else if (!twin.url && mine.url) twin.url = mine.url;
    }
    return out;
}
