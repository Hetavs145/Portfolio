/**
 * Recency-aware retrieval.
 *
 * The bug this exists to fix: asked "what's your most recent LinkedIn post?",
 * pure cosine similarity returned three random fragments of two unrelated posts,
 * none of them the newest — because an embedding of a post carries no signal
 * about *when* it was written. Every post looks equally recent in vector space.
 * The model then answered with a confident, invented date.
 *
 * Similarity answers "what is this about". It cannot answer "which is newest".
 * So time-sensitive questions are routed through metadata instead: chunks carry
 * an ISO `date` and a `kind`, and for a temporal question we pin the newest
 * chunks of the matching kind ahead of whatever similarity returns.
 */

/** Words that mean "order these by time", grouped by direction. */
const NEWEST = /\b(latest|newest|most[- ]recent|recent(ly)?|last|current(ly)?|now(adays)?|these days|lately|today|this (week|month|year)|nowadays|at the moment|up to|these last)\b/i;
const OLDEST = /\b(oldest|earliest|first ever|very first|when did (you|he) (start|begin)|back then|originally)\b/i;

/** "what are you working on" is temporal even without a time word. */
const IMPLICIT_NOW = /\b(working on|build(ing)?|shipp?(ing|ed)|busy with|focused on|up to)\b/i;

/**
 * Position words. "What did you post before that?" is a question about ordering,
 * so it needs the timeline pinned even though it names no date — otherwise
 * similarity returns an arbitrary post and the ordering is invented.
 */
const RELATIVE = /\b(before (that|it|this)|after (that|it|this)|previous|prior|the one before|next one|second|2nd|third|3rd|older|earlier)\b/i;

/** Which corpus a question is about. A question may match more than one. */
const KIND_CUES = [
    { kinds: ['post', 'timeline'], re: /\b(posts?|posted|posting|linkedin|shared?|wrote|updates?)\b/i },
    { kinds: ['commit', 'repo', 'timeline'], re: /\b(commits?|commit(ted|ting)|push(ed|es)?|repos?|repositor(y|ies)|github|code|branch(es)?)\b/i },
    { kinds: ['repo', 'commit', 'timeline'], re: /\b(projects?|building|built|apps?|side project|work(ing)?)\b/i },
];

/** Naming a platform scopes the answer to it: "latest post on LinkedIn". */
const SOURCE_CUES = [
    { source: 'linkedin', re: /\blinked ?in\b/i },
    { source: 'github', re: /\b(github|repo(sitor(y|ies))?s?|commits?|code)\b/i },
];

/**
 * Classify a question's temporal intent.
 * @returns {{temporal: boolean, direction: 'newest'|'oldest', kinds: string[], sources: string[]}}
 */
export function parseIntent(query) {
    const q = String(query || '');

    const oldest = OLDEST.test(q);
    const newest = NEWEST.test(q);
    const implicit = IMPLICIT_NOW.test(q);
    const relative = RELATIVE.test(q);
    const temporal = oldest || newest || implicit || relative;

    if (!temporal) return { temporal: false, direction: 'newest', kinds: [], sources: [] };

    const kinds = new Set();
    for (const cue of KIND_CUES) {
        if (cue.re.test(q)) cue.kinds.forEach((k) => kinds.add(k));
    }
    // No cue at all ("what's new?") — consider everything that carries a date.
    if (kinds.size === 0) ['post', 'repo', 'commit', 'timeline'].forEach((k) => kinds.add(k));

    // If the question names a platform, don't pin the other one — "my latest
    // LinkedIn post" should not spend a slot on a GitHub timeline.
    const sources = SOURCE_CUES.filter((c) => c.re.test(q)).map((c) => c.source);

    return { temporal: true, direction: oldest ? 'oldest' : 'newest', kinds: [...kinds], sources };
}

/**
 * A chunk's stable identity ignoring the "(2/4)" fragment suffix, so three
 * fragments of one long post count as one item when we pick the newest few.
 */
const itemKey = (chunk) => `${chunk.source}|${chunk.title.replace(/\s*\(\d+\/\d+\)\s*$/, '')}`;

/** Fragments of one split item to pin. Enough for the gist, not the whole essay. */
const MAX_FRAGMENTS_PER_ITEM = 2;

/**
 * The newest (or oldest) chunks matching the intent, as retrieval hits.
 *
 * Timeline chunks are pinned first and unconditionally: they already contain the
 * full ordered list, so they answer "which is latest" outright instead of asking
 * the model to compare dates across blocks.
 *
 * @param {{direction: string, kinds: string[]}} intent
 * @param {object[]} chunks every chunk in the index
 * @param {number} limit maximum pins to return
 */
export function recencyPins(intent, chunks, limit = 3) {
    const wanted = new Set(intent.kinds);
    const sources = new Set(intent.sources || []);
    const dated = chunks.filter(
        (c) => c.date && wanted.has(c.kind) && (sources.size === 0 || sources.has(c.source)),
    );
    if (dated.length === 0) return [];

    const dir = intent.direction === 'oldest' ? -1 : 1;
    const byDate = [...dated].sort((a, b) => dir * b.date.localeCompare(a.date));

    const pins = [];
    const seenIds = new Set();

    const take = (chunk) => {
        if (seenIds.has(chunk.id)) return false;
        seenIds.add(chunk.id);
        pins.push({ chunk, score: 1, pinned: true });
        return true;
    };

    // 1. Timelines — the deterministic answer to "which one is latest". At most
    //    one per source, so a paged LinkedIn timeline can't crowd out GitHub, and
    //    always leaving room for at least one real item.
    const timelineBudget = Math.max(1, limit - 1);
    const timelineSources = new Set();

    for (const c of byDate) {
        if (c.kind !== 'timeline') continue;
        if (timelineSources.has(c.source)) continue;
        if (timelineSources.size >= timelineBudget) break;
        // Sorted by date, so the first timeline page seen per source is already
        // the right end of the list for the direction asked about.
        timelineSources.add(c.source);
        take(c);
    }

    // 2. Then the newest (or oldest) distinct items, with every fragment of each,
    //    so the model sees a whole post rather than its middle third. One item per
    //    source first, so a mixed question gets both a post and a commit.
    const bySource = new Map();
    for (const c of byDate) {
        if (c.kind === 'timeline') continue;
        if (!bySource.has(c.source)) bySource.set(c.source, []);
        bySource.get(c.source).push(c);
    }

    const itemSlots = limit - pins.length;
    const rounds = [...bySource.values()];
    const claimed = new Set();

    for (let round = 0; claimed.size < itemSlots && round < 3; round++) {
        for (const list of rounds) {
            if (claimed.size >= itemSlots) break;
            // The nth distinct item from this source.
            const keys = [];
            for (const c of list) {
                const key = itemKey(c);
                if (!keys.includes(key)) keys.push(key);
            }
            const key = keys[round];
            if (!key || claimed.has(key)) continue;
            claimed.add(key);
            // Cap fragments per item: a four-part post shouldn't fill the whole
            // context window when the question only needs its date and gist.
            let used = 0;
            for (const c of list) {
                if (itemKey(c) !== key) continue;
                if (used >= MAX_FRAGMENTS_PER_ITEM) break;
                if (take(c)) used++;
            }
        }
    }

    return pins;
}
