/**
 * Build-time SEO and AEO (answer-engine optimisation).
 *
 * The site is a client-rendered SPA: before this plugin, the HTML every crawler
 * received was an empty <div id="root">. Google renders JavaScript eventually,
 * but most AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot) and link
 * unfurlers never do, so to them the site had no content at all.
 *
 * At build time this plugin, from the same data the page and the chatbot use
 * (src/data/*.js, server/data/resume.json), so nothing can drift:
 *
 *   index.html   <head>: title, description, canonical, robots, Open Graph,
 *                Twitter card, rel="me" identity links, and one JSON-LD @graph
 *                (Person, WebSite, ProfilePage, project ItemList).
 *                <div id="root">: the page's real content as static semantic
 *                HTML. React replaces it on mount (createRoot clears the
 *                container), so visitors see the app; crawlers that don't run
 *                JS read the same facts. Same content, not cloaking.
 *   sitemap.xml  homepage + resume PDF.
 *   robots.txt   everything allowed, AI crawlers named explicitly, sitemap.
 *   llms.txt     plain-markdown profile for LLMs and answer engines
 *                (https://llmstxt.org).
 *   404.html     real 404 for unknown paths (vercel.json no longer rewrites
 *                every path to the homepage, which made soft 404s).
 *   site.webmanifest
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects } from '../src/data/projects.js';
import { achievements } from '../src/data/achievements.js';
import { skills, roles, contact, resumes } from '../src/data/profile.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const resume = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/data/resume.json'), 'utf8'));

export const SITE = 'https://portfolio.vaquah.in';
const NAME = 'Hetav Shah';
const TITLE = 'Hetav Shah | Agentic AI Engineer & Full-Stack Developer';
// ~155 chars: what he does, the proof, the credentials.
const DESCRIPTION =
    'Hetav Shah builds agentic AI, RAG and full-stack systems and deploys them himself. ' +
    'Aetrix 2026 hackathon winner; B.Tech CSE + MBA Finance, Nirma University.';
const OG_IMAGE = `${SITE}/og-image.png`;
const PHOTO = `${SITE}/hetav-shah.jpg`;
const SAME_AS = [
    contact.github,
    contact.linkedin,
    'https://www.instagram.com/hetav.shah145/',
    'https://www.youtube.com/@NeuroStucks',
];
const RESUME_URL = `${SITE}${resumes[0].href.split('?')[0]}`;

/* ------------------------------------------------------------- helpers --- */

const esc = (s) =>
    String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

/** JSON for a <script> tag: "</script>" inside a string must not end it. */
const jsonForScript = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

/** "Jun 2025 -- Aug 2025" -> "Jun 2025 – Aug 2025" */
const dash = (s) => String(s ?? '').replace(/\s*--\s*/g, ' – ');

const firstSentence = (s) => (String(s).match(/^.*?[.!?](\s|$)/)?.[0] ?? String(s)).trim();

const certifications = achievements.find((a) => a.title === 'Certifications')?.details ?? [];
const experience = resume.experience ?? [];

/* ------------------------------------------------------------- JSON-LD --- */

function projectNode(p) {
    const node = {
        '@type': p.github ? 'SoftwareSourceCode' : p.live ? 'WebApplication' : 'CreativeWork',
        name: p.title,
        description: p.description,
        keywords: p.tech.join(', '),
        author: { '@id': `${SITE}/#person` },
    };
    if (p.live) node.url = p.live;
    if (p.github) node.codeRepository = p.github;
    if (!p.live && p.github) node.url = p.github;
    if (node['@type'] === 'WebApplication') node.applicationCategory = 'WebApplication';
    return node;
}

export function jsonLd(buildDate) {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Person',
                '@id': `${SITE}/#person`,
                name: NAME,
                givenName: 'Hetav',
                familyName: 'Shah',
                url: `${SITE}/`,
                image: { '@type': 'ImageObject', url: PHOTO, width: 720, height: 720 },
                jobTitle: 'Agentic AI Engineer and Full-Stack Developer',
                description: resume.summary,
                email: `mailto:${contact.email}`,
                telephone: contact.phone,
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Ahmedabad',
                    addressRegion: 'Gujarat',
                    addressCountry: 'IN',
                },
                nationality: { '@type': 'Country', name: 'India' },
                alumniOf: {
                    '@type': 'CollegeOrUniversity',
                    name: 'Nirma University',
                    url: 'https://nirmauni.ac.in/',
                    address: { '@type': 'PostalAddress', addressLocality: 'Ahmedabad', addressCountry: 'IN' },
                },
                hasOccupation: {
                    '@type': 'Occupation',
                    name: 'AI Engineer',
                    occupationLocation: { '@type': 'Country', name: 'India' },
                    skills: skills.join(', '),
                },
                knowsAbout: [
                    'Agentic AI',
                    'Multi-agent systems',
                    'LangGraph',
                    'Retrieval-augmented generation (RAG)',
                    'Model Context Protocol (MCP)',
                    'Full-stack web development',
                    'Workflow automation',
                    'Docker',
                    'CI/CD',
                    'Finance',
                    ...skills,
                ],
                award: ['1st Place, Aetrix 2026 Hackathon (PDEU), with TrafficMind'],
                hasCredential: certifications.map((c) => {
                    const [name, by] = c.split(' — ');
                    return {
                        '@type': 'EducationalOccupationalCredential',
                        name,
                        credentialCategory: 'certificate',
                        ...(by ? { recognizedBy: { '@type': 'Organization', name: by } } : {}),
                    };
                }),
                sameAs: SAME_AS,
            },
            {
                '@type': 'WebSite',
                '@id': `${SITE}/#website`,
                url: `${SITE}/`,
                name: `${NAME} — Portfolio`,
                description: DESCRIPTION,
                inLanguage: 'en-IN',
                author: { '@id': `${SITE}/#person` },
                publisher: { '@id': `${SITE}/#person` },
            },
            {
                '@type': 'ProfilePage',
                '@id': `${SITE}/#webpage`,
                url: `${SITE}/`,
                name: TITLE,
                description: DESCRIPTION,
                inLanguage: 'en-IN',
                isPartOf: { '@id': `${SITE}/#website` },
                mainEntity: { '@id': `${SITE}/#person` },
                about: { '@id': `${SITE}/#person` },
                primaryImageOfPage: { '@type': 'ImageObject', url: OG_IMAGE, width: 1200, height: 630 },
                dateModified: buildDate,
                hasPart: { '@id': `${SITE}/#projects` },
            },
            {
                '@type': 'ItemList',
                '@id': `${SITE}/#projects`,
                name: `Projects by ${NAME}`,
                itemListOrder: 'https://schema.org/ItemListOrderAscending',
                numberOfItems: projects.length,
                itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: projectNode(p) })),
            },
        ],
    };
}

/* ---------------------------------------------------------------- head --- */

function headTags(buildDate) {
    const meta = (attr, key, content) => `<meta ${attr}="${key}" content="${esc(content)}" />`;
    return [
        `<title>${esc(TITLE)}</title>`,
        meta('name', 'description', DESCRIPTION),
        meta('name', 'author', NAME),
        meta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'),
        `<link rel="canonical" href="${SITE}/" />`,
        `<link rel="sitemap" type="application/xml" href="/sitemap.xml" />`,
        `<link rel="alternate" type="text/markdown" href="/llms.txt" title="${NAME} — profile for LLMs" />`,
        `<link rel="manifest" href="/site.webmanifest" />`,
        ...SAME_AS.map((u) => `<link rel="me" href="${u}" />`),
        // Open Graph (LinkedIn, WhatsApp, Slack, Facebook, Discord unfurls)
        meta('property', 'og:type', 'profile'),
        meta('property', 'og:site_name', `${NAME} — Portfolio`),
        meta('property', 'og:title', TITLE),
        meta('property', 'og:description', DESCRIPTION),
        meta('property', 'og:url', `${SITE}/`),
        meta('property', 'og:locale', 'en_IN'),
        meta('property', 'og:image', OG_IMAGE),
        meta('property', 'og:image:secure_url', OG_IMAGE),
        meta('property', 'og:image:type', 'image/png'),
        meta('property', 'og:image:width', '1200'),
        meta('property', 'og:image:height', '630'),
        meta('property', 'og:image:alt', `${NAME} — Agentic AI Engineer and Full-Stack Developer`),
        meta('property', 'profile:first_name', 'Hetav'),
        meta('property', 'profile:last_name', 'Shah'),
        meta('property', 'profile:username', 'Hetavs145'),
        meta('property', 'og:updated_time', buildDate),
        // Twitter / X
        meta('name', 'twitter:card', 'summary_large_image'),
        meta('name', 'twitter:title', TITLE),
        meta('name', 'twitter:description', DESCRIPTION),
        meta('name', 'twitter:image', OG_IMAGE),
        meta('name', 'twitter:image:alt', `${NAME} — Agentic AI Engineer and Full-Stack Developer`),
        `<script type="application/ld+json">${jsonForScript(jsonLd(buildDate))}</script>`,
    ].join('\n    ');
}

/* --------------------------------------------------------- static body --- */

/**
 * The page's content as plain semantic HTML: one h1, a section per page
 * section, real links. Styled just enough to read as a calm first paint
 * (the same palette and fonts as the app) for the moment before React mounts.
 */
function staticBody() {
    const li = (items) => items.map((t) => `<li>${esc(t)}</li>`).join('');
    const link = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;

    const projectHtml = projects
        .map((p) => {
            const links = [p.live && link(p.live, 'Live site'), p.github && link(p.github, 'Source code')].filter(Boolean).join(' · ');
            return `<article><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><p class="seo-tech">${esc(p.tech.join(' · '))}</p>${
                links ? `<p>${links}</p>` : ''
            }</article>`;
        })
        .join('');

    const experienceHtml = experience
        .map(
            (e) =>
                `<article><h3>${esc(e.subtitle)}, ${esc(e.title)}</h3><p class="seo-tech">${esc(dash(e.meta))}${
                    e.subtitleMeta ? ` · ${esc(e.subtitleMeta)}` : ''
                }</p><ul>${li(e.bullets)}</ul></article>`,
        )
        .join('');

    return `
    <div class="seo-shell">
      <header>
        <p class="seo-kicker">Ahmedabad, India · Portfolio</p>
        <h1>${NAME}</h1>
        <p class="seo-lede">${esc(roles.slice(0, 4).join(' · '))}</p>
        <p>${esc(resume.summary)}</p>
        <p>${link(RESUME_URL, 'Resume (PDF)')} · ${link(`mailto:${contact.email}`, contact.email)} · ${link(contact.github, 'GitHub')} · ${link(contact.linkedin, 'LinkedIn')}</p>
      </header>
      <main>
        <section id="about"><h2>About</h2><p>${esc(firstSentence(resume.summary))}</p><h3>Skills</h3><ul>${li(skills)}</ul></section>
        <section id="experience"><h2>Experience</h2>${experienceHtml}</section>
        <section id="achievements"><h2>Achievements and credentials</h2>${achievements
            .map((a) => `<article><h3>${esc(a.title)}</h3>${a.subtitle ? `<p class="seo-tech">${esc(a.subtitle)}</p>` : ''}<ul>${li(a.details)}</ul></article>`)
            .join('')}</section>
        <section id="work"><h2>Work</h2>${projectHtml}</section>
        <section id="contact"><h2>Contact</h2><p>Open to AI engineering, full-stack and automation roles and freelance builds.</p><ul>
          <li>Email: ${link(`mailto:${contact.email}`, contact.email)}</li>
          <li>Phone: ${link(`tel:${contact.phone}`, contact.phoneDisplay)}</li>
          <li>LinkedIn: ${link(contact.linkedin, 'linkedin.com/in/hetav-shah-26601722b')}</li>
          <li>GitHub: ${link(contact.github, 'github.com/Hetavs145')}</li>
        </ul></section>
      </main>
    </div>`;
}

const SHELL_CSS = `
      .seo-shell{max-width:760px;margin:0 auto;padding:120px 20px 80px;font-family:'Inter Tight',system-ui,sans-serif;color:#0D1117;line-height:1.55}
      .seo-shell h1{font-size:clamp(56px,12vw,120px);line-height:.9;letter-spacing:-.04em;font-weight:600;margin:12px 0 18px}
      .seo-shell h2{font-size:28px;letter-spacing:-.02em;margin:56px 0 12px}
      .seo-shell h3{font-size:18px;margin:22px 0 4px}
      .seo-shell .seo-kicker,.seo-shell .seo-tech{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#5B6573}
      .seo-shell .seo-lede{font-size:20px;color:#3A4452}
      .seo-shell a{color:#0E7490}
      .seo-shell main{margin-top:40vh}`;

/* -------------------------------------------------------------- files ---- */

function sitemap(buildDate) {
    const day = buildDate.slice(0, 10);
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${day}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image><image:loc>${PHOTO}</image:loc></image:image>
    <image:image><image:loc>${OG_IMAGE}</image:loc></image:image>
  </url>
  <url>
    <loc>${RESUME_URL}</loc>
    <lastmod>${day}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;
}

/** Answer engines and AI assistants are welcome: being cited is the goal. */
const AI_CRAWLERS = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-SearchBot',
    'Claude-User',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot-Extended',
    'Bingbot',
    'DuckAssistBot',
    'CCBot',
    'Meta-ExternalAgent',
    'MistralAI-User',
    'cohere-ai',
];

function robots() {
    // No Disallow for the IMNU resume: a blocked URL can't be fetched, so its
    // X-Robots-Tag: noindex (vercel.json) would never be seen.
    return [
        '# Everything here is public on purpose: search engines and AI assistants are welcome.',
        'User-agent: *',
        'Allow: /',
        '',
        ...AI_CRAWLERS.map((ua) => `User-agent: ${ua}`),
        'Allow: /',
        '',
        `Sitemap: ${SITE}/sitemap.xml`,
        '',
    ].join('\n');
}

function llmsTxt(buildDate) {
    const lines = [
        `# ${NAME}`,
        '',
        `> ${NAME} is an Agentic AI Engineer and Full-Stack Developer from Ahmedabad, India. He designs, builds and deploys AI systems that automate business and finance workflows end to end: multi-agent LangGraph pipelines, RAG agents, agent-run CRMs and production commerce platforms. He won 1st place at the Aetrix 2026 hackathon (PDEU) and is studying an integrated B.Tech in Computer Science and MBA in Finance at Nirma University (2023–2028).`,
        '',
        `Last updated: ${buildDate.slice(0, 10)}. Canonical site: ${SITE}/`,
        '',
        '## Quick answers',
        '',
        `- **Who is ${NAME}?** An Agentic AI Engineer and Full-Stack Developer in Ahmedabad, India, studying an integrated B.Tech (CSE) and MBA (Finance major, Digital Transformation and Analytics minor) at Nirma University.`,
        `- **What does he build?** Multi-agent AI systems (LangGraph, MCP, RAG), full-stack web platforms (React, Next.js, Node.js, FastAPI) and automation pipelines (n8n, GitHub Actions), which he deploys himself (Docker, Nginx, Vercel, Render, Supabase, Linux VPS).`,
        `- **Notable achievement?** 1st place at the Aetrix 2026 hackathon at PDEU (March 21–22, 2026, team 2AM Coders) with TrafficMind, a 6-agent LangGraph co-pilot for traffic incident command.`,
        `- **Work experience?** ${experience.map((e) => `${e.subtitle} at ${e.title} (${dash(e.meta)})`).join('; ')}.`,
        `- **Is he open to work?** Yes: AI engineering, full-stack and automation roles, internships and freelance builds.`,
        `- **How to contact him?** Email ${contact.email}, phone ${contact.phoneDisplay}, LinkedIn ${contact.linkedin}`,
        '',
        '## Links',
        '',
        `- [Portfolio](${SITE}/): projects, experience, achievements and an AI agent that answers questions about his work`,
        `- [Resume (PDF)](${RESUME_URL})`,
        `- [GitHub](${contact.github})`,
        `- [LinkedIn](${contact.linkedin})`,
        '',
        '## Experience',
        '',
        ...experience.flatMap((e) => [`### ${e.subtitle}, ${e.title} (${dash(e.meta)})`, '', ...e.bullets.map((b) => `- ${b}`), '']),
        '## Projects',
        '',
        ...projects.flatMap((p) => [
            `### ${p.title}${p.production ? ' (production)' : ''}`,
            '',
            p.description,
            '',
            `- Stack: ${p.tech.join(', ')}`,
            ...(p.live ? [`- Live: ${p.live}`] : []),
            ...(p.github ? [`- Source: ${p.github}`] : []),
            '',
        ]),
        '## Achievements and credentials',
        '',
        ...achievements.flatMap((a) => [`### ${a.title}${a.subtitle ? ` — ${a.subtitle}` : ''}`, '', ...a.details.map((d) => `- ${d}`), '']),
        '## Skills',
        '',
        ...Object.entries(resume.skills ?? {}).map(([group, items]) => `- **${group}:** ${[].concat(items).join(', ')}`),
        '',
    ];
    return lines.join('\n');
}

function notFound() {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>Page not found | ${NAME}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#E8ECF0;color:#0D1117;font-family:system-ui,sans-serif;text-align:center;padding:20px}
    h1{font-size:64px;letter-spacing:-.04em;margin:16px 0 8px}
    a{color:#0E7490}
  </style>
</head>
<body>
  <main>
    <img src="/favicon.svg" alt="" width="72" height="72" />
    <h1>404</h1>
    <p>This page doesn't exist. <a href="/">Go to ${NAME}'s portfolio</a>.</p>
  </main>
</body>
</html>
`;
}

function manifest() {
    return JSON.stringify(
        {
            name: `${NAME} — Portfolio`,
            short_name: NAME,
            description: DESCRIPTION,
            start_url: '/',
            display: 'browser',
            background_color: '#E8ECF0',
            theme_color: '#E8ECF0',
            icons: [
                { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
                { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
            ],
        },
        null,
        2,
    );
}

/* -------------------------------------------------------------- plugin --- */

export default function seo() {
    const buildDate = new Date().toISOString();
    return {
        name: 'portfolio-seo',
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                return html
                    .replace(/<title>[\s\S]*?<\/title>/, headTags(buildDate))
                    .replace('</head>', `  <style>${SHELL_CSS}\n  </style>\n</head>`)
                    .replace('<div id="root"></div>', `<div id="root">${staticBody()}\n  </div>`);
            },
        },
        generateBundle() {
            const emit = (fileName, source) => this.emitFile({ type: 'asset', fileName, source });
            emit('sitemap.xml', sitemap(buildDate));
            emit('robots.txt', robots());
            emit('llms.txt', llmsTxt(buildDate));
            emit('404.html', notFound());
            emit('site.webmanifest', manifest());
        },
    };
}
