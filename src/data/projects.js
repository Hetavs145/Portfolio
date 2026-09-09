/**
 * Single source of truth for the projects grid.
 *
 * Imported by src/components/Projects.jsx AND by the RAG backend
 * (server/lib/sources/site.js), so the chatbot can never describe a different
 * set of projects than the page shows.
 *
 * Shape: { title, description, tech[], live, github, youtube?, featured }
 * `featured` is 'primary' (amber + Star), 'secondary' (teal + Zap), or null.
 * See src/components/ProjectCard.jsx for how those map to styling.
 */

export const projects = [
    {
        title: 'VaquaH Cooling Service',
        description:
            'Full-stack HVAC/Cooling services platform — e-commerce with 50+ products, smart search, coupon system, tiered shipping, wishlist, Razorpay & COD checkout. Includes service booking, AMC plans, appointment tracking, user dashboard, RAG-powered AI chatbot, hands-free voice assistant ("Say VaquaH"), and gesture navigation with virtual cursor, pinch-to-click, and swipe via MediaPipe.',
        tech: ['React (Vite)', 'Tailwind CSS', 'Node.js', 'Express', 'Firebase', 'Razorpay', 'Google Generative AI', 'MediaPipe', 'Framer Motion'],
        live: 'https://vaquah.in',
        github: 'https://github.com/Hetavs145/VaquaH',
        youtube: 'https://www.youtube.com/@NeuroStucks',
        featured: 'primary',
    },
    {
        title: 'TrafficMind',
        description:
            '6-agent LangGraph multi-agent system for traffic incident command. Parallel fan-out/fan-in orchestration, 250-segment live road network, sub-0.34s response, Digital Twin view, DBSCAN hotspot prediction, and voice chat. Won 1st place at Aetrix 2026, PDEU.',
        tech: ['LangGraph', 'FastAPI', 'Next.js', 'Groq', 'Gemini', 'WebSocket'],
        live: null,
        github: 'https://github.com/Hetavs145/TrafficMind',
        featured: 'secondary',
    },
    {
        title: 'Kontexo',
        description:
            'Agentic MCP gateway — a JSON-RPC 2.0 MCP server exposing 19 tools across GitHub, Slack, Sheets and Trello, driven by a 10-node LangGraph state machine. One plain-English prompt drives a multi-step workflow across four services, gated by human approval.',
        tech: ['LangGraph', 'JSON-RPC 2.0', 'Celery', 'Redis', 'ChromaDB', 'Python'],
        live: null,
        github: 'https://github.com/fjiolla/Kontexo',
        featured: 'secondary',
    },
    {
        title: 'FlowPilot',
        description:
            'Agentic AI for autonomous enterprise workflows, built for the Economic Times AI Hackathon 2026. Six specialized agents — Orchestrator, Data Retrieval, Decision, Execution, Verification and Recovery — collaborate over a LangGraph directed state graph with conditional routing. Adds 3-tier self-healing recovery (retry → reroute → escalate) and an immutable audit trail logging every agent decision, so nothing fails silently.',
        tech: ['LangGraph', 'TypeScript', 'Gemini 2.0 Flash', 'Multi-Agent', 'Next.js'],
        live: null,
        github: 'https://github.com/Hetavs145/ET-Gen-Hackathon',
        featured: 'secondary',
    },
    {
        title: 'YouTube Upload Automation',
        description:
            'n8n agentic workflow automating daily YouTube uploads end to end. 90% reduced manual time with LLM-based metadata auto-generation and 100% field compliance.',
        tech: ['n8n', 'Google Drive API', 'Google Sheets API', 'LLM'],
        live: null,
        github: 'https://github.com/Hetavs145/youtube-renderer',
        featured: null,
    },
    {
        title: 'Treat-o-Meter',
        description:
            'Web app that scores and tracks treats against daily intake targets, with a live meter UI and persistent history.',
        tech: ['JavaScript', 'React', 'Vercel'],
        live: 'https://treat-o-meter.vercel.app',
        github: 'https://github.com/Hetavs145/Treat-o-Meter',
        featured: null,
    },
    {
        title: 'Sign2Text',
        description:
            'Real-time ASL gesture-to-text recognition using MediaPipe hand landmarks and CNN-LSTM sequence model for 26 gestures with smoothing and windowing.',
        tech: ['Python', 'MediaPipe', 'CNN-LSTM', 'TensorFlow'],
        live: null,
        github: 'https://github.com/Hetavs145/Sign2Text',
        featured: null,
    },
    {
        title: 'Hetchat',
        description:
            'Real-Time Chat App with live messaging, presence indicators, and reconnection logic.',
        tech: ['React', 'Socket.IO', 'Node.js'],
        live: null,
        github: 'https://github.com/Hetavs145/Hetchat',
        featured: null,
    },
    {
        title: 'Drone Path-Finder',
        description:
            'Smart Delivery Drone Path-Finder Simulation. Optimizes delivery routes using advanced algorithms.',
        tech: ['Python', 'Algorithms', 'Simulation'],
        live: null,
        github: 'https://github.com/Hetavs145/Smart-Delivery-Drone-Path-Finder',
        featured: null,
    },
    {
        title: 'Spam Detector',
        description: 'Spam Email Detection System using Machine Learning.',
        tech: ['Python', 'Scikit-learn', 'ML'],
        live: null,
        github: 'https://github.com/Hetavs145/Spam-Email-Detector',
        featured: null,
    },
    {
        title: 'Phishing Detector',
        description: 'ML-based Phishing Website Detection System.',
        tech: ['Python', 'ML', 'Cybersecurity'],
        live: null,
        github: 'https://github.com/Hetavs145/Phishing-detector',
        featured: null,
    },
    {
        title: 'Kernel Scribe',
        description:
            'Operating-system simulator with live views of process scheduling, memory allocation and IPC.',
        tech: ['TypeScript', 'OS', 'Kernel'],
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
