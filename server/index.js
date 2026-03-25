import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (_req, res) => {
    res.json({ status: 'ok', agent: 'portfolio-rag-agent' });
});

// --- LangGraph-inspired RAG Agent ---
const resumeContext = `
Hetav Shah — Full-stack developer and agentic AI engineer.
Location: Gujarat, India. Email: hetavs145@gmail.com. Phone: +91 8200135258.

Skills: JavaScript, TypeScript, Python, C++, Java, SQL, React, Next.js, Tailwind CSS, Mapbox GL JS, Node.js, Express.js, FastAPI, Firebase, WebSocket, LangGraph, LangChain, n8n, Groq, Google Gemini, RAG, Whisper STT, scikit-learn, TensorFlow, PyTorch, MediaPipe, OpenCV, DBSCAN, Docker, Pydantic, Zustand, NetworkX, OSMnx.

Experience: Full-Stack Developer Intern (Team Lead) at NTS Global Nihon (Jun–Aug 2025). Engineered Firebase backend modules. Developed Kaamigo chatbot (RAG-based) with 50+ interaction flows. Shipped real-time chat across 3 platforms.

Projects:
- VaquaH: Production HVAC/cooling services e-commerce platform with 50+ products, Razorpay checkout, 8 service modules, RAG AI chatbot, voice assistant, gesture navigation. Live at vaquah.in.
- TrafficMind: 6-agent LangGraph multi-agent system for traffic incident command. Parallel fan-out/fan-in orchestration. 250-segment live road network, sub-0.34s response using Groq Llama 3.3 70B. Digital Twin, DBSCAN hotspot prediction, voice chat. Won 1st place at hackathon.
- YouTube Upload Automation Agent: n8n workflow automating daily YouTube uploads from Google Drive, 90% reduced manual time, LLM metadata auto-generation.
- Sign2Text: Real-time ASL gesture recognition using MediaPipe + CNN-LSTM for 26 gestures.

Achievements: Won 1st place hackathon (Team 2AM Coders, March 2026). 36 hours non-stop. Only team recognized across all 3 evaluation phases.

Education: Integrated B.Tech CS + MBA at Nirma University (Expected May 2028). CGPA: 7.04/10.

Certifications: AWS Cloud Foundations, Intro to LangGraph, n8n AI Agent Builder, Full Stack Dev (NTS Global), C Programming (Coursera).
`.trim();

const systemPrompt = `You are Hetav — responding as yourself on your portfolio website. You know everything about yourself from the context below. 

RULES:
- Reply like a real human chatting casually. SHORT replies — 1-2 sentences max.
- Be warm but not over-the-top. No emojis unless the user uses them first.
- If someone says hi/hello, just greet back naturally.
- If asked about something not in your context, be honest — "hmm not sure about that" or redirect to what you do know.
- Never use bullet points or markdown formatting. Just plain conversational text.
- Sound like a 21-year-old dev who's passionate but chill.

Context about you:
${resumeContext}`;

app.post('/api/chat', async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages array required' });
    }

    try {
        const groqMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-10),
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: groqMessages,
                max_tokens: 120,
                temperature: 0.75,
                top_p: 0.9,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Groq API error:', err);
            return res.status(502).json({ error: 'LLM service error' });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "hmm, let me think about that...";

        return res.json({ message: reply });
    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Portfolio Agent Server running on port ${PORT}`);
});
