/**
 * Imports LinkedIn's official data export — safely.
 *
 *   npm run import:linkedin -- ~/Downloads/Basic_LinkedInDataExport_11-06-2026.zip
 *   npm run import:linkedin -- ~/Downloads/LinkedInDataExport/      (already unzipped)
 *
 * Get the export from LinkedIn -> Settings -> Data privacy -> "Get a copy of your
 * data". It's free and official; the emailed link is the only manual step.
 *
 * Only the profile/post CSVs the knowledge base reads are copied into
 * server/data/linkedin-export/. The archive also contains messages, connections,
 * email addresses and invitations — those are never copied, and .gitignore
 * refuses them even if someone unzips the whole archive into that folder.
 *
 * Commit the result; the nightly rebuild (and any push touching the folder)
 * picks it up.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { EXPORT_DIR, EXPORT_FILES } from '../lib/sources/linkedin/export.js';

const input = process.argv[2];
if (!input) {
    console.error('Usage: npm run import:linkedin -- <export.zip | unzipped folder>');
    process.exit(1);
}

let sourceDir = path.resolve(input);
let tmp = null;

if (sourceDir.toLowerCase().endsWith('.zip')) {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'li-export-'));
    try {
        // Extract only the whitelisted files, wherever they sit inside the archive.
        execFileSync('unzip', ['-o', '-j', sourceDir, ...EXPORT_FILES.flatMap((f) => [f, `*/${f}`]), '-d', tmp], {
            stdio: 'ignore',
        });
    } catch {
        // unzip exits non-zero when some patterns don't match; check what landed.
    }
    if (!fs.readdirSync(tmp).length) {
        console.error('Could not extract the export (is `unzip` installed?). Unzip it manually and pass the folder.');
        process.exit(1);
    }
    sourceDir = tmp;
}

/** Find a file by name anywhere under dir (exports sometimes nest folders). */
function findFile(dir, name) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.toLowerCase() === name.toLowerCase()) return full;
        if (entry.isDirectory()) {
            const hit = findFile(full, name);
            if (hit) return hit;
        }
    }
    return null;
}

fs.mkdirSync(EXPORT_DIR, { recursive: true });
const copied = [];
for (const name of EXPORT_FILES) {
    const from = findFile(sourceDir, name);
    if (!from) continue;
    fs.copyFileSync(from, path.join(EXPORT_DIR, name));
    copied.push(name);
}

if (tmp) fs.rmSync(tmp, { recursive: true, force: true });

if (!copied.length) {
    console.error(`None of ${EXPORT_FILES.join(', ')} were found in ${input}.`);
    process.exit(1);
}

fs.writeFileSync(
    path.join(EXPORT_DIR, 'meta.json'),
    JSON.stringify({ importedAt: new Date().toISOString(), files: copied }, null, 2) + '\n',
);

console.log(`Imported ${copied.length} file(s) into ${path.relative(process.cwd(), EXPORT_DIR)}:`);
for (const f of copied) console.log(`  ${f}`);
const missing = EXPORT_FILES.filter((f) => !copied.includes(f));
if (missing.length) console.log(`Not in this export (fine for a partial export): ${missing.join(', ')}`);
console.log('\nCommit server/data/linkedin-export/ and push — the next rebuild uses it.');
