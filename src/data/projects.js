/**
 * Single source of truth for the projects grid.
 *
 * Imported by src/components/Projects.jsx AND by the RAG backend
 * (server/lib/sources/site.js), so the chatbot can never describe a different
 * set of projects than the page shows.
 *
 * Shape: { title, description, tech[], live, github, youtube?, featured, production? }
 * `featured` is 'primary' (Flagship label), 'secondary' (Featured label), or null.
 * `production: true` marks production-grade builds: their Work row expands to
 * the full write-up, links and architecture diagram. Other rows are compact,
 * non-expanding entries with their links inline.
 * See src/components/ProjectRow.jsx for how these map to the UI.
 */

export const projects = [
    {
        title: 'VaquaH Cooling Service',
        description:
            'Full-stack HVAC/Cooling services platform — e-commerce with 50+ products, smart search, coupon system, tiered shipping, wishlist, Razorpay & COD checkout. Includes service booking, AMC plans, appointment tracking, user dashboard, RAG-powered AI chatbot, hands-free voice assistant ("Say VaquaH"), and gesture navigation with virtual cursor, pinch-to-click, and swipe via MediaPipe. Deployed by Hetav: frontend on Vercel at vaquah.in, the Express API Dockerised (Docker Compose) behind an Nginx reverse proxy that load-balances backend replicas, with a LangGraph agent that scales the replicas.',
        tech: ['React (Vite)', 'Tailwind CSS', 'Node.js', 'Express', 'Firebase', 'Razorpay', 'Google Generative AI', 'MediaPipe', 'Framer Motion', 'Docker', 'Nginx', 'Vercel'],
        live: 'https://vaquah.in',
        github: 'https://github.com/Hetavs145/VaquaH',
        youtube: 'https://www.youtube.com/@NeuroStucks',
        featured: 'primary',
        production: true,
    },
    {
        title: 'TrafficMind',
        description:
            '6-agent LangGraph multi-agent system for traffic incident command. Parallel fan-out/fan-in orchestration, 250-segment live road network, sub-0.34s response, Digital Twin view, DBSCAN hotspot prediction, and voice chat. Won 1st place at Aetrix 2026, PDEU.',
        tech: ['LangGraph', 'FastAPI', 'Next.js', 'Groq', 'Gemini', 'WebSocket'],
        live: null,
        github: 'https://github.com/Hetavs145/TrafficMind',
        featured: 'secondary',
        production: true,
    },
    {
        title: 'Aven',
        description:
            'Agentic AI CRM and outreach autopilot, live at aven.harkeswanen.in. A prerendered site and Supabase CRM covering leads, deals, proposals, invoices and projects, with 2FA, row-level security and an audit log. An always-on agent on a self-managed Linux VPS drafts outreach from free lead scrapers (1,400+ prospects sourced); anything that commits the business waits in a human approvals queue.',
        tech: ['React', 'TypeScript', 'Supabase', 'Deno Edge Functions', 'MCP', 'Hermes Agent', 'Claude Code', 'Gemini', 'Linux VPS'],
        live: 'https://aven.harkeswanen.in',
        github: null,
        featured: null,
        production: true,
    },
    {
        title: 'Kontexo',
        description:
            'Agentic MCP gateway — a JSON-RPC 2.0 MCP server exposing 19 tools across GitHub, Slack, Sheets and Trello, driven by a 10-node LangGraph state machine. One plain-English prompt drives a multi-step workflow across four services, gated by human approval.',
        tech: ['LangGraph', 'JSON-RPC 2.0', 'Celery', 'Redis', 'ChromaDB', 'Python'],
        live: null,
        github: 'https://github.com/fjiolla/Kontexo',
        featured: 'secondary',
        production: true,
    },
    {
        title: 'FlowPilot',
        description:
            'Agentic AI for autonomous enterprise workflows, built for the Economic Times AI Hackathon 2026. Six specialized agents — Orchestrator, Data Retrieval, Decision, Execution, Verification and Recovery — collaborate over a LangGraph directed state graph with conditional routing. Adds 3-tier self-healing recovery (retry → reroute → escalate) and an immutable audit trail logging every agent decision, so nothing fails silently.',
        tech: ['LangGraph', 'TypeScript', 'Gemini 2.0 Flash', 'Multi-Agent', 'Next.js'],
        live: null,
        github: 'https://github.com/Hetavs145/ET-Gen-Hackathon',
        featured: 'secondary',
        production: true,
    },
    {
        title: 'Cartoon Shorts Engine',
        description:
            'Automated bilingual story studio for 6 channels, fully automated in the cloud. A daily scheduled run per niche picks an idea (Google Trends for the trending niche), writes English and Hinglish scripts and animates a new cast in a three.js cartoon world. Each language is voiced by its own engine (narrator plus character voices), then rendered and mixed with FFmpeg, captioned, and published as a Short and Reel to 6 YouTube and Instagram channels via Composio.',
        tech: ['Python', 'three.js', 'FFmpeg', 'Kokoro TTS', 'Microsoft neural voices', 'Composio', 'Scheduled cloud agents'],
        live: null,
        github: null,
        featured: null,
        production: true,
    },
    {
        title: 'Portfolio RAG Agent',
        description:
            'RAG agent behind this site, refreshed nightly by CI. It answers from indexed chunks of Hetav\'s GitHub, LinkedIn and resumes with cited, streamed replies, plus a recruiter mode that matches a job description to his profile. A nightly GitHub Actions job scrapes LinkedIn and the site (Playwright), re-embeds the knowledge base, runs a regression eval and redeploys. Frontend on Vercel, Express API on Render.',
        tech: ['React', 'Vite', 'Three.js', 'Node.js', 'Express', 'NVIDIA NIM', 'Hybrid RAG', 'GitHub Actions', 'Playwright', 'Vercel', 'Render'],
        live: 'https://portfolio.vaquah.in',
        github: 'https://github.com/Hetavs145/Portfolio',
        featured: null,
        production: true,
    },
    {
        title: 'YouTube Upload Automation',
        description:
            'Self-hosted n8n workflow that publishes a YouTube video every day end to end, cutting manual upload time by 90%. It picks a category by weekday, generates an idea with an LLM via OpenRouter and rejects near-duplicates using embeddings, writes the script and metadata, renders stills with Pollinations, narration with Piper TTS and the final video with FFmpeg, then uploads through the YouTube Data API.',
        tech: ['n8n', 'OpenRouter LLM', 'Embeddings', 'Piper TTS', 'FFmpeg', 'YouTube Data API', 'Docker'],
        live: null,
        github: 'https://github.com/Hetavs145/youtube-renderer',
        featured: null,
        production: true,
    },
    {
        title: 'Treat-o-Meter',
        description:
            'Reward-and-punishment tracker: timed tasks and habits earn or cost a points balance, with a 5-day streak tracker, a transaction history with PDF export, and Google sign-in with offline-first sync from localStorage to Firestore.',
        tech: ['React 19', 'Vite', 'Firebase Auth', 'Firestore', 'jsPDF'],
        live: 'https://treat-o-meter.vercel.app',
        github: 'https://github.com/Hetavs145/Treat-o-Meter',
        featured: null,
    },
    {
        title: 'Sign2Text',
        description:
            'Real-time ASL fingerspelling to text. MediaPipe Hands locates the hand and a MobileNetV2 CNN (PyTorch transfer learning) classifies the crop into 29 classes — A–Z plus space, delete and nothing — committing a letter after a 1-second hold at 70%+ confidence, with optional speech output. A browser version runs the same model through ONNX Runtime Web.',
        tech: ['Python', 'PyTorch', 'MobileNetV2', 'MediaPipe', 'OpenCV', 'ONNX Runtime Web'],
        live: 'https://web-sigma-six-80.vercel.app',
        github: 'https://github.com/Hetavs145/Sign2Text',
        featured: null,
    },
    {
        title: 'Hetchat',
        description:
            'Real-time chat app with chat rooms and groups, typing indicators and online / last-seen presence. Messages are saved to Firestore and relayed live through a Node/Express Socket.IO server, with Firebase sign-in by email or Google.',
        tech: ['React', 'Vite', 'Socket.IO', 'Node.js', 'Express', 'Firebase'],
        live: 'https://client-omega-six-11.vercel.app',
        github: 'https://github.com/Hetavs145/Hetchat',
        featured: null,
    },
    {
        title: 'Drone Path-Finder',
        description:
            'Delivery-drone route planner: an Express API runs A* (Haversine heuristic) and Dijkstra around circular no-fly zones, and a React dashboard draws both routes side by side with distance, flight time and battery use estimated from each route\'s energy cost.',
        tech: ['JavaScript', 'React', 'Node.js', 'Express', 'A*', 'Dijkstra'],
        live: 'https://smart-drone-path-finder.vercel.app',
        github: 'https://github.com/Hetavs145/Smart-Delivery-Drone-Path-Finder',
        featured: null,
    },
    {
        title: 'Spam Detector',
        description: 'Spam Email Detection System using Machine Learning.',
        tech: ['Python', 'Scikit-learn', 'ML'],
        live: 'https://ml-frontend-nu.vercel.app',
        github: 'https://github.com/Hetavs145/Spam-Email-Detector',
        featured: null,
    },
    {
        title: 'Phishing Detector',
        description: 'ML-based Phishing Website Detection System.',
        tech: ['Python', 'ML', 'Cybersecurity'],
        live: 'https://frontend-steel-eight-98.vercel.app',
        github: 'https://github.com/Hetavs145/Phishing-detector',
        featured: null,
    },
    {
        title: 'Kernel Scribe',
        description:
            'Operating-system simulator built on a tick-driven microkernel: Round Robin, Priority and FCFS scheduling, first-fit memory allocation over 1024 MB and message-passing IPC, with live Matplotlib charts and tables in a Tkinter GUI.',
        tech: ['Python', 'Tkinter', 'Matplotlib', 'OS'],
        live: null,
        github: 'https://github.com/Hetavs145/kernel-scribe-sim',
        featured: null,
    },
    {
        title: 'Harzino Blog',
        description: 'Animated blog platform with a modern UI and motion-driven page transitions.',
        tech: ['TypeScript', 'React', 'Animation'],
        // harzino.com no longer resolves (domain expired), so link the source instead.
        live: null,
        github: 'https://github.com/Hetavs145/Harzino',
        featured: null,
    },
];

export default projects;
