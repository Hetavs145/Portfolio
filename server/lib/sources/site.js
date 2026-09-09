/**
 * Site content -> chunks.
 *
 * Imports the SAME data modules the React components render from, so the bot can
 * never describe a different set of projects or certifications than the page
 * shows. Those modules are deliberately framework-free (no lucide imports, icons
 * are stored as names) precisely so plain Node can read them.
 */

import { projects } from '../../../src/data/projects.js';
import { achievements } from '../../../src/data/achievements.js';
import { skills, roles } from '../../../src/data/profile.js';
import { makeChunk, splitLong } from '../chunk.js';

export function siteChunks() {
    const chunks = [];

    for (const p of projects) {
        const links = [
            p.live ? `Live: ${p.live}` : null,
            p.github ? `Source: ${p.github}` : null,
            p.youtube ? `Video: ${p.youtube}` : null,
        ].filter(Boolean);

        chunks.push(
            ...splitLong(
                'site',
                `Portfolio project — ${p.title}`,
                `${p.title}. ${p.description} Tech: ${p.tech.join(', ')}. ${links.join('. ')}`,
            ),
        );
    }

    // Competition results, stated so plainly that they cannot be recombined.
    //
    // Retrieval does its job here — asked about the ET-Gen hackathon it returns
    // the FlowPilot chunks, which say only that FlowPilot was *built for* that
    // hackathon. But a nearby block naming a 1st place at a different event was
    // enough for the model to answer "yes, I won 1st place at the Economic Times
    // AI Hackathon". Prompt rules did not stop it; a fact in the corpus does.
    //
    // Both lists are derived, not hardcoded, so this stays true as things change.
    const wins = achievements.filter((a) => /winner|1st place|first place|won/i.test(
        `${a.title} ${a.subtitle ?? ''} ${(a.details ?? []).join(' ')}`,
    ));
    const hackathonProjects = projects.filter((p) =>
        /hackathon/i.test(`${p.title} ${p.description}`),
    );
    // "Hackathon Winner — 1st Place" is a card heading, not a sentence. Pasted in
    // raw it came back out of the model as "I won the Hackathon Winner — 1st
    // Place — Aetrix 2026", so turn the label into the placement it denotes.
    const wonEvents = wins.map((w) => {
        const place = /1st|first/i.test(w.title) ? '1st place' : w.title.replace(/\s*—.*$/, '');
        const where = (w.subtitle ?? '').replace(/\s*·\s*/g, ', ').trim();
        return where ? `${place} at ${where}` : place;
    });
    // Name the event as well as the project. Someone asking "did the ET-Gen one
    // win?" searches on the hackathon's name, not the project's, so the chunk has
    // to carry both or it never gets retrieved for the question it exists to answer.
    const eventOf = (p) => {
        const m = /(?:built |made |created )?for the ([^.,]*?hackathon[^.,]*)/i.exec(p.description);
        return m ? m[1].trim() : null;
    };
    const unplacedDetails = hackathonProjects
        .filter((p) => !wins.some((w) => (w.details ?? []).join(' ').includes(p.title)))
        .map((p) => ({
            title: p.title,
            repo: p.github ? p.github.split('/').pop() : null,
            event: eventOf(p),
        }));

    if (wonEvents.length) {
        chunks.push(
            ...splitLong(
                'site',
                'Competition results — every win Hetav has',
                `Hetav's competition wins, in full: ${wonEvents.join('; ')}. ` +
                    `That is the complete list. No other competition, hackathon or event has any ` +
                    `recorded placement, prize or win.`,
            ),
        );
    }

    // One chunk per entered-but-unplaced event, phrased as the question someone
    // actually asks and answered with a leading "No".
    //
    // A single combined chunk did not work: it opened with the Aetrix win, and
    // the model read that first and answered "Yes, I won 1st place at Aetrix" to
    // a question about a different hackathon. Leading with the negative, and
    // keeping each event in its own chunk, removes the adjacent win it was
    // borrowing from.
    for (const project of unplacedDetails) {
        const names = [project.title, project.repo, project.event].filter(Boolean);
        chunks.push(
            ...splitLong(
                'site',
                `Did ${project.title} win? — no placement recorded`,
                `No. ${project.title}${project.repo ? ` (GitHub repo ${project.repo})` : ''} did NOT win ` +
                    `${project.event ? `the ${project.event}` : 'its hackathon'}. ` +
                    `It was entered and built for that event, but no win, prize, placement or ranking ` +
                    `is recorded for it anywhere. ` +
                    `It goes by several names — ${names.join(', ')} — and under every one of them the ` +
                    `result is the same: entered, not won. Being built for a hackathon is not the same ` +
                    `as winning one, and a win at a different event does not count for this one.`,
            ),
        );
    }

    for (const a of achievements) {
        chunks.push(
            ...splitLong(
                'site',
                `Portfolio section — ${a.title}`,
                [a.title, a.subtitle, ...a.details].filter(Boolean).join('. '),
            ),
        );
    }

    chunks.push(
        makeChunk('site', 'Skills listed on the site', `Skills shown on the portfolio: ${skills.join(', ')}.`),
    );
    chunks.push(
        makeChunk(
            'site',
            'How Hetav describes his roles',
            `Hetav describes himself on his site as: ${roles.join('; ')}.`,
        ),
    );

    return chunks;
}
