/**
 * Skills, roles, cursor keywords and resume links — shared by the frontend and
 * the RAG backend so nothing drifts between what the page shows and what the
 * chatbot believes.
 */

/** About section skill list. */
export const skills = [
    'JavaScript / TypeScript',
    'Python',
    'React / Next.js',
    'Node.js / FastAPI',
    'LangGraph / LangChain',
    'MCP / RAG',
    'n8n / Automation',
    'Groq / Gemini (LLMs)',
    'TensorFlow / PyTorch',
    'Three.js / WebSocket',
    'Power BI / Analytics',
    'Firebase / Supabase',
    'Docker / Nginx',
    'GitHub Actions (CI/CD)',
    'Vercel / Render / Linux VPS',
    'Web scraping (Playwright)',
    'Git',
];

/** Hero rotating-role carousel. Keyframes are derived from length, so just add here. */
export const roles = [
    'Full-Stack Developer',
    'Agentic AI Engineer',
    'Finance & Automation',
    'Multi-Agent Systems',
    'RAG & Retrieval',
    'Real-Time Systems',
    'Hackathon Winner',
];

/** Keyword pool sprayed by the ResumeAura cursor when nothing contextual is hovered. */
export const cursorKeywords = [
    'Full-Stack',
    'Agentic',
    'Finance',
    'Automation',
    'RAG',
    'Multi-Agent',
    'MCP',
    'LangGraph',
    'Embeddings',
    'Vector Search',
    'n8n',
    'FastAPI',
    'Next.js',
    'React',
    'Node.js',
    'Python',
    'LLMs',
    'WebSocket',
    'Power BI',
    'Analytics',
    'Fintech',
    'Real-Time',
];

/**
 * Resume downloads. The "Get Resume" dropdown in the Hero and both Navbar
 * entries render from this one array, so a filename change is a single edit.
 */
export const resumes = [
    {
        label: 'Current Resume',
        href: '/Hetav_Shah_Resume.pdf?v=20261117',
        description: 'Current resume — projects, stack, experience',
    },
    {
        // The institute's placement cell mandates this format and signs off on it.
        // Flagging that here stops a recruiter reading it as Hetav's own resume
        // and judging him on a template he didn't choose.
        label: 'IMNU Resume',
        href: '/Hetav_Shah_IMNU.pdf?v=20260911',
        description: 'SPOC-approved institute format — not my own resume',
    },
];

/**
 * Public contact channels. The agent's "contact" buttons (server/lib/actions.js)
 * read these, so a changed email or handle is a single edit.
 */
export const contact = {
    email: 'hetavs145@gmail.com',
    phone: '+918200135258',
    phoneDisplay: '+91 82001 35258',
    linkedin: 'https://www.linkedin.com/in/hetav-shah-26601722b/',
    github: 'https://github.com/Hetavs145',
};
