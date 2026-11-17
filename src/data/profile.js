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
 * Resume downloads. The Hero and Navbar resume buttons render from this one
 * array, so a filename change is a single edit. With one entry they are plain
 * links; add a second and they become a dropdown again. The institute-format
 * IMNU resume is deliberately not listed: it isn't Hetav's own resume.
 */
export const resumes = [
    {
        label: 'Current Resume',
        href: '/Hetav_Shah_Resume.pdf?v=20261117b',
        description: 'Current resume — projects, stack, experience',
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
