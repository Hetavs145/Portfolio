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
