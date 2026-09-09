/**
 * Single source of truth for the Achievements & Credentials section.
 *
 * Imported by src/components/Achievements.jsx AND by the RAG backend
 * (server/lib/sources/site.js).
 *
 * `icon` is a lucide icon NAME, not a component — this module has to be
 * importable by plain Node, so it must not pull in lucide-react.
 * Achievements.jsx maps the name back to a component.
 * `color` must be one of the keys in Achievements.jsx's colorMap: teal | amber | purple.
 */

export const achievements = [
    {
        icon: 'Trophy',
        title: 'Hackathon Winner — 1st Place',
        subtitle: 'Aetrix 2026, PDEU · Team 2AM Coders · March 21–22, 2026',
        color: 'amber',
        details: [
            'Won 1st place at first-ever hackathon — 36 hours of non-stop building.',
            'Presented TrafficMind in Smart Transportation to 8+ judges and mentors, praised across both evaluation rounds and the final panel.',
            'Only team recognized across all 3 phases — Phase 1 discussions, mentor evaluations, and final judge presentations.',
        ],
    },
    {
        icon: 'GraduationCap',
        title: 'Education',
        subtitle: 'Nirma University · 2023–2028',
        color: 'teal',
        details: [
            'Integrated B.Tech in Computer Science & Engineering + MBA',
            'B.Tech — Institute of Technology, Nirma University (2023–2026)',
            'MBA — Institute of Management, Nirma University (2026–2028)',
            'MBA Major: Finance · Minor: Digital Transformation & Analytics',
        ],
    },
    {
        icon: 'Users',
        title: 'Position of Responsibility',
        subtitle: 'Swayam — The Entrepreneurship Club, IMNU · 2026–2028',
        color: 'teal',
        details: [
            'Member and Student Coordinator, Swayam — The Entrepreneurship Club, IMNU.',
            'Responsible for Administration, Public Relations and Event Management.',
        ],
    },
    {
        icon: 'Award',
        title: 'Certifications',
        subtitle: null,
        color: 'purple',
        details: [
            'Power BI for Beginners — Simplilearn',
            'Introduction to LangGraph — Simplilearn',
            'n8n: No Code AI Agent Builder — Simplilearn',
            'Cloud Foundations — AWS Academy',
            'C for Everyone Part 2: Structured Programming — UC Santa Cruz, Coursera',
            'Full Stack Development — NTS Global Nihon',
        ],
    },
];

export default achievements;
