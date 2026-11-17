/**
 * Contact intent: questions like "how do I reach you?", "I want to connect",
 * "can you build a website for my firm?" are asking for a way to get in touch,
 * not for a project. For those the agent:
 *
 *   1. pins the contact block into retrieval, so the reply can actually give the
 *      email and LinkedIn (similarity search missed it: "connect directly"
 *      shares no words with "Email hetavs145@gmail.com. LinkedIn …"), and
 *   2. shows Email / LinkedIn / Call buttons instead of whatever blocks happened
 *      to rank highest.
 */

import { contact } from '../../src/data/profile.js';

const CONTACT_INTENT = new RegExp(
    [
        'contact', 'connect', 'reach (you|out|him)', 'get in touch', 'in touch with',
        // Not bare "linkedin", "number" or "rate": "what did you post on LinkedIn?",
        // "the number of agents" and "accuracy rate" aren't asking to get in touch.
        'e-?mail', 'mail you', 'phone', 'call (you|him)', 'whats ?app',
        '(phone|mobile|contact|whats ?app) (number|no\\.?)', 'your number',
        'linked ?in (profile|url|link|id|handle|account|page)', '(your|his) linked ?in(?! post| activity)',
        'find (you|him) on', 'hire', 'hiring', 'freelanc', 'work with (you|him)', 'collaborat',
        'available for', 'open to (work|opportunit|roles|internship)',
        '(make|build|develop|design|create) (a |an |me a |us a )?(website|site|web ?app|app|landing page|portfolio|dashboard|bot|chatbot)',
        'for (my|our) (firm|company|startup|business|client|team|brand|shop|store)',
        'quote', 'pricing', '(your|hourly|daily|day|project) rates?\\b', 'how (do|can) i (talk|speak|meet)',
    ].join('|'),
    'i',
);

export const hasContactIntent = (question) => CONTACT_INTENT.test(question || '');

/** Ids of the chunks that hold the contact details, best first. */
export function contactChunks(all) {
    const pick = (re) => all.find((c) => re.test(c.title));
    return [pick(/^Contact and links$/i), pick(/^Website — Contact/i)].filter(Boolean);
}

/** Buttons for a contact-intent reply. */
export function contactActions() {
    return [
        { type: 'email', label: 'Email', url: `mailto:${contact.email}`, id: 'action:email' },
        { type: 'linkedin', label: 'LinkedIn', url: contact.linkedin, id: 'action:linkedin' },
        { type: 'phone', label: 'Call', url: `tel:${contact.phone}`, id: 'action:phone' },
    ];
}
