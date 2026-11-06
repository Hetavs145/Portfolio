/**
 * Official LinkedIn data-export adapter — the free, authoritative ground truth.
 *
 * LinkedIn -> Settings -> Data Privacy -> "Get a copy of your data".
 * A selective export arrives by email in minutes; the full archive within 24h.
 * Unzip it into server/data/linkedin-export/ and this reads it directly.
 *
 * It cannot be automated (interactive password + emailed one-time link), so treat
 * it as a quarterly manual refresh. Profile facts barely change; the live adapter
 * layers posts and drift on top of this.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, '..', '..', '..', 'data', 'linkedin-export');

/**
 * Minimal RFC-4180 CSV parser — handles quoted fields containing commas,
 * newlines and escaped quotes, which LinkedIn's post/summary columns all use.
 */
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (quoted) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    quoted = false;
                }
            } else {
                field += ch;
            }
            continue;
        }

        if (ch === '"') quoted = true;
        else if (ch === ',') {
            row.push(field);
            field = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            if (row.some((c) => c !== '')) rows.push(row);
            row = [];
            field = '';
        } else field += ch;
    }
    row.push(field);
    if (row.some((c) => c !== '')) rows.push(row);

    if (rows.length === 0) return [];
    const header = rows[0].map((h) => h.trim());
    return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

function readCsv(name) {
    const file = path.join(DIR, name);
    if (!fs.existsSync(file)) return [];
    // LinkedIn ships UTF-8 with a BOM.
    return parseCsv(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
}

/** True when at least one expected CSV is present, so the cascade can skip it cleanly. */
export const EXPORT_DIR = DIR;

export function hasExport() {
    return fs.existsSync(DIR) && fs.readdirSync(DIR).some((f) => f.toLowerCase().endsWith('.csv'));
}

/**
 * The only export files this pipeline reads. scripts/import-linkedin-export.js
 * copies exactly these out of the archive, and .gitignore refuses everything
 * else in the folder — the full archive also holds messages, connections and
 * email addresses, none of which belong in a public repo.
 */
export const EXPORT_FILES = [
    'Profile.csv',
    'Positions.csv',
    'Education.csv',
    'Skills.csv',
    'Certifications.csv',
    'Honors.csv',
    'Projects.csv',
    'Shares.csv',
];

/** When the export was imported (written by the import script), or null. */
export function exportImportedAt() {
    try {
        const meta = JSON.parse(fs.readFileSync(path.join(DIR, 'meta.json'), 'utf8'));
        return meta.importedAt ?? null;
    } catch {
        return null;
    }
}

/**
 * Shares the exporter marks as visible to connections only. The bot is public,
 * so those stay out of its knowledge base.
 */
const isConnectionsOnly = (row) => /connection/i.test(row['Visibility'] ?? '');

/**
 * Profile and full post history from the export, or null when none is present.
 * Unlike the live adapters this is not capped at a page of recent posts: the
 * export carries every share, so it backfills the archive in one go.
 */
export function readExport() {
    if (!hasExport()) return null;
    const profileRow = readCsv('Profile.csv')[0] ?? {};
    return {
        importedAt: exportImportedAt(),
        profile: {
            headline: profileRow['Headline'] || null,
            summary: profileRow['Summary'] || null,
            location: profileRow['Geo Location'] || profileRow['Location'] || null,
            positions: readCsv('Positions.csv'),
            education: readCsv('Education.csv'),
            skills: readCsv('Skills.csv').map((r) => r['Name'] ?? r['Skill'] ?? '').filter(Boolean),
            certifications: readCsv('Certifications.csv'),
            honors: readCsv('Honors.csv'),
            projects: readCsv('Projects.csv'),
        },
        posts: readCsv('Shares.csv')
            .filter((r) => !isConnectionsOnly(r))
            .map((r) => ({
                text: r['ShareCommentary'] ?? '',
                postedAt: r['Date'] ?? null,
                url: r['ShareLink'] || null,
                reactions: null,
            })),
    };
}

export async function fetchLinkedIn() {
    if (!hasExport()) throw new Error(`No CSV export found in ${DIR}`);

    const profileRow = readCsv('Profile.csv')[0] ?? {};

    return {
        source: 'export',
        profileUrl: process.env.LINKEDIN_PROFILE_URL || null,
        fetchedAt: new Date().toISOString(),
        profile: {
            headline: profileRow['Headline'] ?? null,
            summary: profileRow['Summary'] ?? null,
            location: profileRow['Geo Location'] ?? profileRow['Location'] ?? null,
            positions: readCsv('Positions.csv'),
            education: readCsv('Education.csv'),
            skills: readCsv('Skills.csv').map((r) => r['Name'] ?? r['Skill'] ?? ''),
            certifications: readCsv('Certifications.csv'),
            honors: readCsv('Honors.csv'),
            projects: readCsv('Projects.csv'),
        },
        posts: readCsv('Shares.csv')
            .slice(0, 25)
            .map((r) => ({
                text: r['ShareCommentary'] ?? '',
                postedAt: r['Date'] ?? null,
                url: r['ShareLink'] ?? null,
                reactions: null,
            })),
    };
}
