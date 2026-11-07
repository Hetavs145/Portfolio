/**
 * Answers you've written down for questions the bot couldn't handle.
 *
 * Two inputs, both optional:
 *
 *   1. content/faq.md — "## Question" headings, each followed by the answer in
 *      your own words.
 *   2. Open GitHub issues labelled kb-miss (opened automatically by
 *      lib/misses.js) where you've commented "Answer: ...". Answering from the
 *      GitHub app on your phone is enough; the next rebuild learns it. Close
 *      the issue to retire the answer.
 *
 * Only comments by the repo owner count, so a stranger commenting "Answer:" on
 * a public issue can't put words in your mouth.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeChunk } from '../chunk.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FAQ_FILE = path.join(HERE, '..', '..', '..', 'content', 'faq.md');
const REPO = process.env.GITHUB_ISSUES_REPO || process.env.GITHUB_REPOSITORY || 'Hetavs145/Portfolio';
const LABEL = 'kb-miss';
const TRUSTED = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);

const entry = (question, answer, extra = {}) =>
    makeChunk(
        'faq',
        `Q&A — ${question.length > 80 ? `${question.slice(0, 77)}…` : question}`,
        `Someone asked: "${question}" Hetav's own answer: ${answer}`,
        extra,
    );

function fromFile() {
    if (!fs.existsSync(FAQ_FILE)) return [];
    const text = fs.readFileSync(FAQ_FILE, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    const chunks = [];
    for (const block of text.split(/^##\s+/m).slice(1)) {
        const [heading, ...rest] = block.split('\n');
        const question = heading.trim();
        const answer = rest.join('\n').replace(/\s+/g, ' ').trim();
        if (question && answer) chunks.push(entry(question, answer));
    }
    return chunks;
}

/** "_Question as asked:_ `...`" from the issue body, else the title minus its prefix. */
function questionOf(issue) {
    const m = /_Question as asked:_\s*`([^`]+)`/.exec(issue.body || '');
    if (m) return m[1].trim();
    return issue.title.replace(/^Bot couldn['’]t answer:\s*/i, '').trim();
}

async function fromIssues() {
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-agent' };
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_ISSUES_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = `https://api.github.com/repos/${REPO}/issues?labels=${LABEL}&state=open&per_page=100`;
    let res = await fetch(url, { headers });
    // A stale or wrong token shouldn't block reading a public repo's issues.
    if (res.status === 401 && headers.Authorization) {
        delete headers.Authorization;
        res = await fetch(url, { headers });
    }
    if (!res.ok) throw new Error(`issues -> HTTP ${res.status}`);
    const issues = (await res.json()).filter((i) => !i.pull_request && i.comments > 0);

    const chunks = [];
    for (const issue of issues) {
        const cres = await fetch(issue.comments_url + '?per_page=100', { headers });
        if (!cres.ok) continue;
        const answers = (await cres.json()).filter(
            (c) => TRUSTED.has(c.author_association) && /^\s*answer\s*:/i.test(c.body || ''),
        );
        const latest = answers.at(-1);
        if (!latest) continue;
        const answer = latest.body.replace(/^\s*answer\s*:\s*/i, '').replace(/\s+/g, ' ').trim();
        if (answer) chunks.push(entry(questionOf(issue), answer, { url: issue.html_url }));
    }
    return chunks;
}

/**
 * @returns {Promise<{chunks: object[], issuesFailed: string | null}>}
 */
export async function faqChunks() {
    const chunks = fromFile();
    let issuesFailed = null;
    try {
        chunks.push(...(await fromIssues()));
    } catch (err) {
        issuesFailed = err.message;
    }
    return { chunks, issuesFailed };
}
