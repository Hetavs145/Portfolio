/**
 * Derives structured JSON from the two resume source files at the repo root.
 *
 *   Hetav_Shah_Resume.tex          -> server/data/resume.json
 *   23BTM026_Hetav_Shah_SPOC.docx  -> server/data/resume-imnu.json
 *
 * The PDFs are deliberately NOT parsed: they use subset-embedded fonts, so text
 * extraction returns garbage. They exist to be served to visitors, nothing more.
 *
 * Run this after editing either resume, eyeball the JSON diff, then rebuild the
 * index. Keeping it a separate step means a parser bug shows up as a reviewable
 * diff instead of silently poisoning what the bot believes about you.
 *
 *   npm run parse:resumes
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const DATA = path.join(HERE, '..', 'data');

const TEX = path.join(ROOT, 'Hetav_Shah_Resume.tex');
// The IMNU resume is the SPOC-approved institute format — a template the
// placement cell mandates, not a resume Hetav wrote or would send by choice.
const IMNU_DOCX = path.join(ROOT, '23BTM026_Hetav_Shah_SPOC.docx');

/* ------------------------------------------------------------------ LaTeX -- */

/** Strip LaTeX markup down to readable prose. */
function detex(s) {
    return s
        .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
        .replace(/\\textbf\{([^}]*)\}/g, '$1')
        .replace(/\\textit\{([^}]*)\}/g, '$1')
        .replace(/\\normalfont\s*/g, '')
        .replace(/\\itshape\s*/g, '')
        .replace(/\\small\s*/g, '')
        .replace(/\{|\}/g, '')
        .replace(/\\textperiodcentered\\?/g, '·')
        .replace(/\\textbullet\\?/g, '·')
        .replace(/\\%/g, '%')
        .replace(/\\&/g, '&')
        .replace(/\\\\/g, ' ')
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseTex(src) {
    // Body only — drop the preamble so \newcommand definitions aren't parsed as content.
    const body = src.slice(src.indexOf('\\begin{document}'));

    const sections = {};
    const sectionRe = /\\section\{([^}]*)\}([\s\S]*?)(?=\\section\{|\\end\{document\})/g;
    let m;
    while ((m = sectionRe.exec(body)) !== null) {
        sections[detex(m[1]).toLowerCase()] = m[2];
    }

    /** \entry{title}{meta} followed by an optional \sub{}{} and an itemize block. */
    function parseEntries(block) {
        if (!block) return [];
        const out = [];
        const entryRe = /\\entry\{([\s\S]*?)\}\{([\s\S]*?)\}([\s\S]*?)(?=\\entry\{|$)/g;
        let e;
        while ((e = entryRe.exec(block)) !== null) {
            const [, rawTitle, rawMeta, rest] = e;

            const sub = /\\sub\{([\s\S]*?)\}\{([\s\S]*?)\}/.exec(rest);
            const bullets = [];
            const items = rest.match(/\\item\s+([\s\S]*?)(?=\\item|\\end\{itemize\}|$)/g) || [];
            for (const item of items) {
                const text = detex(item.replace(/^\\item\s+/, ''));
                if (text) bullets.push(text);
            }

            // Some entries carry a plain {\small ...} note instead of an itemize list.
            // The last such note in a section has no \par terminator, so don't require one.
            if (bullets.length === 0) {
                const note = /\{\\small\s+([\s\S]*?)\}(?:\\par|\s*$|\s*\n)/.exec(rest);
                if (note) {
                    const text = detex(note[1]);
                    if (text) bullets.push(text);
                }
            }

            out.push({
                title: detex(rawTitle),
                meta: detex(rawMeta),
                subtitle: sub ? detex(sub[1]) : null,
                subtitleMeta: sub ? detex(sub[2]) : null,
                bullets,
            });
        }
        return out;
    }

    /** The skills block is a two-column tabular: Category & comma-separated list. */
    function parseSkills(block) {
        if (!block) return {};
        const skills = {};
        const rowRe = /\\textbf\{([^}]*)\}\s*&\s*([\s\S]*?)\\\\/g;
        let r;
        while ((r = rowRe.exec(block)) !== null) {
            skills[detex(r[1])] = detex(r[2])
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        }
        return skills;
    }

    const header = /\\begin\{center\}([\s\S]*?)\\end\{center\}/.exec(body);
    const links = [...(header?.[1].matchAll(/\\href\{([^}]*)\}\{([^}]*)\}/g) || [])].reduce(
        (acc, [, url, label]) => {
            acc[detex(label).toLowerCase()] = url.replace(/^mailto:/, '');
            return acc;
        },
        {},
    );

    return {
        name: 'Hetav Shah',
        contact: {
            location: 'Gujarat, India',
            email: links.email || 'hetavs145@gmail.com',
            phone: '+91 8200135258',
            github: links.github || 'https://github.com/Hetavs145',
            linkedin: links.linkedin || '',
            portfolio: links.portfolio || '',
        },
        summary: detex(sections.summary || ''),
        skills: parseSkills(sections.skills),
        experience: parseEntries(sections.experience),
        projects: parseEntries(sections.projects),
        achievements: parseEntries(sections['achievements and positions']),
        education: parseEntries(sections.education),
        certifications: detex(sections.certifications || '')
            .split('·')
            .map((s) => s.trim())
            .filter(Boolean),
    };
}

/* ------------------------------------------------------------------ docx --- */

/** A .docx is a zip; word/document.xml holds the text. Read it without a dependency. */
function readDocxXml(file) {
    const buf = fs.readFileSync(file);

    // Walk local file headers looking for word/document.xml.
    let offset = 0;
    while (offset < buf.length - 4) {
        if (buf.readUInt32LE(offset) !== 0x04034b50) {
            offset++;
            continue;
        }
        const method = buf.readUInt16LE(offset + 8);
        const compSize = buf.readUInt32LE(offset + 18);
        const nameLen = buf.readUInt16LE(offset + 26);
        const extraLen = buf.readUInt16LE(offset + 28);
        const name = buf.slice(offset + 30, offset + 30 + nameLen).toString('utf8');
        const dataStart = offset + 30 + nameLen + extraLen;

        if (name === 'word/document.xml') {
            const data = buf.slice(dataStart, dataStart + compSize);
            return method === 0 ? data.toString('utf8') : zlib.inflateRawSync(data).toString('utf8');
        }
        // compSize is 0 when sizes live in a trailing data descriptor; fall back to scanning.
        offset = compSize > 0 ? dataStart + compSize : offset + 1;
    }
    throw new Error(`word/document.xml not found in ${file}`);
}

/** XML -> array of non-empty paragraph strings, tabs preserved as separators. */
function docxParagraphs(xml) {
    return xml
        .replace(/<\/w:p>/g, '\n')
        .replace(/<w:tab[^>]*\/>/g, '\t')
        .replace(/<w:br[^>]*\/>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .split('\n')
        .map((l) => l.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
}

/**
 * The IMNU resume is a flat sequence of ALL-CAPS headings followed by content
 * lines, so group on the headings rather than guessing at structure.
 */
function parseImnu(lines) {
    const HEADINGS = [
        'ACADEMIC ACHIEVEMENTS',
        'INTERNSHIP',
        'ACADEMIC PROJECTS',
        'POSITION OF RESPONSIBILITY',
        'EXTRA-CURRICULAR ACHIEVEMENTS',
    ];

    const groups = {};
    let current = 'header';
    groups[current] = [];
    for (const line of lines) {
        if (HEADINGS.includes(line.toUpperCase())) {
            current = line.toUpperCase();
            groups[current] = [];
        } else {
            groups[current].push(line);
        }
    }

    // "21 | Male | IMNU | Major - Finance | Minor - Digital Transformation & Analytics"
    const profileLine = groups.header.find((l) => l.includes('|')) || '';
    const fields = profileLine.split('|').map((s) => s.trim());
    const pick = (prefix) =>
        (fields.find((f) => f.toLowerCase().startsWith(prefix)) || '')
            .split('-')
            .slice(1)
            .join('-')
            .trim();

    // Academic rows come in triples: qualification / years / institution, then a % line.
    const academics = [];
    const acad = groups['ACADEMIC ACHIEVEMENTS'] || [];
    for (let i = 0; i < acad.length; i++) {
        if (/^\d{4}-\d{4}$/.test(acad[i])) {
            const scoreLine = acad[i + 2] || '';
            academics.push({
                qualification: acad[i - 1] || '',
                years: acad[i],
                institution: acad[i + 1] || '',
                score: /%$/.test(scoreLine) ? scoreLine : null,
            });
        }
    }

    return {
        name: 'Hetav Shah',
        institute: 'Institute of Management, Nirma University (IMNU)',
        profile: profileLine,
        major: pick('major') || 'Finance',
        minor: pick('minor') || 'Digital Transformation & Analytics',
        academics,
        internship: groups.INTERNSHIP || [],
        projects: groups['ACADEMIC PROJECTS'] || [],
        positions: groups['POSITION OF RESPONSIBILITY'] || [],
        extracurricular: groups['EXTRA-CURRICULAR ACHIEVEMENTS'] || [],
    };
}

/* ------------------------------------------------------------------- main -- */

function main() {
    fs.mkdirSync(DATA, { recursive: true });

    if (!fs.existsSync(TEX)) throw new Error(`Missing ${TEX}`);
    const resume = parseTex(fs.readFileSync(TEX, 'utf8'));
    fs.writeFileSync(path.join(DATA, 'resume.json'), JSON.stringify(resume, null, 2) + '\n');
    console.log(
        `resume.json      ${resume.projects.length} projects · ${resume.experience.length} roles · ` +
            `${Object.keys(resume.skills).length} skill groups · ${resume.certifications.length} certs`,
    );

    if (!fs.existsSync(IMNU_DOCX)) throw new Error(`Missing ${IMNU_DOCX}`);
    const imnu = parseImnu(docxParagraphs(readDocxXml(IMNU_DOCX)));
    fs.writeFileSync(path.join(DATA, 'resume-imnu.json'), JSON.stringify(imnu, null, 2) + '\n');
    console.log(
        `resume-imnu.json ${imnu.academics.length} academic rows · major "${imnu.major}" · minor "${imnu.minor}"`,
    );
}

main();
