/**
 * Resume -> chunks. Reads the JSON produced by scripts/parse-resumes.js.
 *
 * The two resumes overlap but neither is a superset: the main resume has the
 * project detail and CGPA, while the IMNU one is the only source for the MBA
 * specialisation and the 10th/12th results.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeChunk, splitLong } from '../chunk.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, '..', '..', 'data');

const readJson = (file) => {
    const p = path.join(DATA, file);
    if (!fs.existsSync(p)) {
        console.warn(`[resume] ${file} missing — run \`npm run parse:resumes\``);
        return null;
    }
    return JSON.parse(fs.readFileSync(p, 'utf8'));
};

/** Flatten an entry (title/meta/subtitle/bullets) into one readable paragraph. */
function entryText(e) {
    const head = [e.title, e.meta].filter(Boolean).join(' — ');
    const sub = [e.subtitle, e.subtitleMeta].filter(Boolean).join(', ');
    return [head, sub, ...e.bullets].filter(Boolean).join('. ');
}

export function resumeChunks() {
    const chunks = [];

    // A recruiter's actual first question is "which resume do I read?", and none
    // of the chunks below answer it: they are titled "Education", "Project — X",
    // "Contact and links", so the bare word "resume" matches nothing and the bot
    // used to claim it had no resume at all. This chunk exists to be that answer.
    chunks.push(
        makeChunk(
            'resume',
            'Resumes — which one to read and where to get them',
            `Hetav publishes one resume on his portfolio site: the "Resume" / "Get Resume" ` +
                `button opens his current resume at /Hetav_Shah_Resume.pdf — projects, stack, ` +
                `experience, achievements, education and certifications. It is his real resume and ` +
                `the one to read for engineering, AI, software or any other role. He also has an ` +
                `IMNU resume, the SPOC-approved format mandated by the Institute of Management, ` +
                `Nirma University placement cell, used only for campus placements; it is not his ` +
                `own resume and is not published on the site. Anyone who needs it can ask him by email.`,
        ),
    );

    const r = readJson('resume.json');

    if (r) {
        const c = r.contact || {};
        chunks.push(
            makeChunk(
                'resume',
                'Contact and links',
                `${r.name} is based in ${c.location}. Email ${c.email}. Phone ${c.phone}. ` +
                    `GitHub ${c.github}. LinkedIn ${c.linkedin}. Portfolio ${c.portfolio}.`,
            ),
        );

        if (r.summary) chunks.push(...splitLong('resume', 'Professional summary', r.summary));

        for (const [category, items] of Object.entries(r.skills || {})) {
            chunks.push(
                makeChunk('resume', `Skills — ${category}`, `${category}: ${items.join(', ')}.`),
            );
        }

        for (const job of r.experience || []) {
            chunks.push(...splitLong('resume', `Experience — ${job.title}`, entryText(job)));
        }

        for (const proj of r.projects || []) {
            // Project titles are "Name: tagline" — key the chunk on the name alone
            // so a question like "what is Kontexo" matches cleanly.
            const name = proj.title.split(':')[0].trim();
            chunks.push(...splitLong('resume', `Project — ${name}`, entryText(proj)));
        }

        for (const a of r.achievements || []) {
            chunks.push(...splitLong('resume', `Achievement — ${a.title}`, entryText(a)));
        }

        for (const e of r.education || []) {
            chunks.push(makeChunk('resume', 'Education — degree and CGPA', entryText(e)));
        }

        if (r.certifications?.length) {
            chunks.push(
                makeChunk(
                    'resume',
                    'Certifications',
                    `Certifications: ${r.certifications.join('; ')}.`,
                ),
            );
        }
    }

    const imnu = readJson('resume-imnu.json');
    if (imnu) {
        // The bot gets asked "which resume should I read?". It should know the
        // IMNU one is an institute-mandated format the placement SPOC approves,
        // not a resume Hetav wrote — otherwise it defends its formatting as his.
        chunks.push(
            makeChunk(
                'resume-imnu',
                'About the IMNU resume',
                `The IMNU resume is the SPOC-approved resume in the format mandated by the ` +
                    `Institute of Management, Nirma University placement cell. It is not Hetav's own ` +
                    `resume and not the one he would send by choice — its structure and wording follow ` +
                    `the institute template. It is used only for campus placements and is not ` +
                    `published on his portfolio site; anyone who needs it can ask him by email. His actual ` +
                    `resume is the current one on the site, the right read for any role.`,
            ),
        );

        chunks.push(
            makeChunk(
                'resume-imnu',
                'MBA specialisation',
                `At ${imnu.institute}, Hetav's MBA major is ${imnu.major} and his minor is ${imnu.minor}. ` +
                    `Profile line from the IMNU resume: ${imnu.profile}.`,
            ),
        );

        for (const a of imnu.academics || []) {
            const score = a.score ? ` Score: ${a.score}.` : '';
            chunks.push(
                makeChunk(
                    'resume-imnu',
                    `Academics — ${a.qualification}`,
                    `${a.qualification} at ${a.institution}, ${a.years}.${score}`,
                ),
            );
        }

        if (imnu.positions?.length) {
            chunks.push(
                makeChunk(
                    'resume-imnu',
                    'Position of responsibility',
                    imnu.positions.join('. ') + '.',
                ),
            );
        }

        // The extracurricular block pairs a short label line with a detail line;
        // keeping them together preserves the certification descriptions.
        if (imnu.extracurricular?.length) {
            chunks.push(
                ...splitLong(
                    'resume-imnu',
                    'Extra-curricular and certifications detail',
                    imnu.extracurricular.join('. '),
                ),
            );
        }
    }

    return chunks;
}
