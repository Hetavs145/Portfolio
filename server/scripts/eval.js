/**
 * Regression eval for the portfolio agent. Runs after every index build so a
 * bad rebuild fails before it ships (see .github/workflows/refresh-kb.yml).
 *
 *   node server/scripts/eval.js                    # retrieval + answers
 *   node server/scripts/eval.js --retrieval-only   # no chat-model calls
 *   node server/scripts/eval.js --only=hackathon-win,trafficmind
 *
 * Two layers, defined in server/eval/questions.json:
 *
 *   Retrieval  — did the right chunk come back for the question? Deterministic
 *                for a given index, so every retrieval check must pass.
 *   Answers    — ask the real model and check the reply for required facts,
 *                forbidden claims (the hallucinations this bot has actually
 *                produced before), the [[unanswered]] signal and sources.
 *                `critical` cases must pass; the rest need MIN_PASS_RATE overall.
 *                Free model pools are sometimes all busy: a case that can't get
 *                an answer is reported as skipped, not failed, and retried once.
 *
 * Exit code 1 on failure, so CI stops before committing the new index.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { retrieve, answer } from '../lib/retrieve.js';
import { loadIndex } from '../lib/vectorstore.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SPEC = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'eval', 'questions.json'), 'utf8'));
const MIN_PASS_RATE = Number(process.env.EVAL_MIN_PASS_RATE || 0.8);

const args = process.argv.slice(2);
const retrievalOnly = args.includes('--retrieval-only');
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',');

const re = (pattern) => new RegExp(pattern, 'i');
const cases = SPEC.cases.filter((c) => !only || only.includes(c.id));

function checkRetrieval(c, hits) {
    const want = c.retrieval?.anyTitle;
    if (!want?.length) return null;
    const titles = hits.map((h) => h.chunk.title);
    const ok = titles.some((t) => want.some((p) => re(p).test(t)));
    return ok ? [] : [`retrieval: none of ${JSON.stringify(want)} in top ${titles.length} (${titles.slice(0, 4).join(' | ')}…)`];
}

function checkAnswer(c, result) {
    const problems = [];
    const msg = result.message || '';
    const spec = c.answer || {};
    for (const p of spec.mustInclude ?? []) if (!re(p).test(msg)) problems.push(`missing /${p}/`);
    for (const p of [...(spec.mustNotInclude ?? []), ...(SPEC.global?.mustNotInclude ?? [])]) {
        if (re(p).test(msg)) problems.push(`forbidden /${p}/`);
    }
    if (spec.unanswered != null && Boolean(result.unanswered) !== spec.unanswered) {
        problems.push(`unanswered=${Boolean(result.unanswered)}, expected ${spec.unanswered}`);
    }
    if (spec.hasSources && !(result.sources?.length > 0)) problems.push('no sources cited');
    return problems;
}

const busy = (err) => err?.status === 429 || err?.status === 503 || /busy|rate.?limit|unavailable/i.test(err?.message || '');

async function ask(q) {
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await answer([{ role: 'user', content: q }]);
        } catch (err) {
            if (!busy(err) || attempt === 1) throw err;
            await new Promise((r) => setTimeout(r, 8000));
        }
    }
    return null;
}

async function main() {
    const index = loadIndex({ quiet: true });
    if (!index) throw new Error('No index on disk — build it first');
    console.log(`Eval: ${cases.length} case(s) against ${index.chunks.length} chunks (${index.vectorsUsable ? 'vector' : 'lexical'} retrieval)\n`);

    let retrievalFail = 0;
    let answered = 0;
    let passed = 0;
    let skipped = 0;
    const criticalFail = [];

    for (const c of cases) {
        const lines = [];
        let ok = true;

        if (c.retrieval) {
            const { hits } = await retrieve(c.q);
            const problems = checkRetrieval(c, hits);
            if (problems?.length) {
                retrievalFail++;
                ok = false;
                lines.push(...problems);
            }
        }

        if (!retrievalOnly && c.answer) {
            try {
                const result = await ask(c.q);
                answered++;
                const problems = checkAnswer(c, result);
                if (problems.length) {
                    ok = false;
                    lines.push(...problems, `reply: ${JSON.stringify(result.message.slice(0, 220))}`);
                    if (c.critical) criticalFail.push(c.id);
                } else {
                    passed++;
                }
            } catch (err) {
                if (!busy(err)) throw err;
                skipped++;
                lines.push(`skipped: model pools busy (${err.message.slice(0, 80)})`);
            }
        }

        console.log(`${ok ? '✓' : '✗'} ${c.id}${c.critical ? ' (critical)' : ''}`);
        for (const l of lines) console.log(`    ${l}`);
    }

    const rate = answered ? passed / answered : 1;
    console.log(
        `\nRetrieval failures: ${retrievalFail}` +
            (retrievalOnly ? '' : ` · answers ${passed}/${answered} passed (${(rate * 100).toFixed(0)}%)` + (skipped ? ` · ${skipped} skipped` : '')),
    );

    const reasons = [];
    if (retrievalFail) reasons.push(`${retrievalFail} retrieval check(s) failed`);
    if (criticalFail.length) reasons.push(`critical case(s) failed: ${criticalFail.join(', ')}`);
    if (!retrievalOnly && answered && rate < MIN_PASS_RATE) reasons.push(`answer pass rate ${(rate * 100).toFixed(0)}% < ${MIN_PASS_RATE * 100}%`);
    if (!retrievalOnly && !answered && cases.some((c) => c.answer)) {
        console.warn('WARNING: no answer checks could run (all model pools busy) — only retrieval was verified.');
    }

    if (reasons.length) {
        console.error(`\nEVAL FAILED: ${reasons.join('; ')}`);
        process.exit(1);
    }
    console.log('\nEval passed.');
}

main().catch((err) => {
    console.error(`\nEval crashed: ${err.message}`);
    process.exit(1);
});
