# Hetav Shah — Portfolio

A modern, interactive developer portfolio built with React, Three.js, and Framer Motion — featuring an AI-powered chat agent, dynamic cursor effects, and a fully responsive design.

## 🚀 Key Features

### 🎨 Interactive Experience

- **3D Background**: Three.js-powered animated background with real-time rendering.
- **Resume Aura Cursor**: Custom canvas cursor that emits floating keyword particles (Full-Stack, Agentic, LangGraph, etc.) based on which section you're hovering.
- **Magnetic Buttons**: Buttons that pull toward your cursor with spring physics.
- **Smooth Animations**: Framer Motion transitions on scroll, hover, and page load.
- **Glitch Effect**: Cyberpunk-style name animation in the hero section.

### 🤖 AI Chat Agent

- **LangGraph-Inspired RAG Agent**: Ask anything about Hetav — skills, projects, experience.
- **Groq Llama 3.3 70B**: Fast, human-like responses with sub-second latency.
- **Conversation Memory**: Maintains context across the chat session (last 10 messages).
- **Vercel Serverless**: Backend runs as a Vercel serverless function — no separate server needed.

### 📂 Sections

- **Hero**: Animated intro with rotating titles (Full-Stack Developer, Agentic AI Engineer, Hackathon Winner).
- **About**: Bio, skills grid, and profile image with animated aura rings.
- **Experience**: Timeline-style work history with detailed bullet points.
- **Achievements**: Hackathon win (1st place), education, and certifications with color-coded cards.
- **Projects**: Featured project cards with golden (VaquaH) and teal (TrafficMind) highlighting, plus all other projects with GitHub/live links.
- **Talk to My Agent**: Live AI chat demo powered by Groq.
- **Contact**: Email, phone, and social links with magnetic button interactions.

### 🏆 Featured Projects

- **VaquaH Cooling Service**: Full-stack HVAC/Cooling e-commerce platform — 50+ products, smart search, coupon system, tiered shipping, wishlist, Razorpay & COD checkout, service booking, AMC plans, RAG-powered AI chatbot, hands-free voice assistant, and gesture navigation via MediaPipe.
- **TrafficMind**: 6-agent LangGraph multi-agent system for traffic incident command — parallel fan-out/fan-in orchestration, 250-segment live road network, sub-0.34s response using Groq Llama 3.3 70B, Digital Twin view, DBSCAN hotspot prediction, and voice chat.

## 💻 Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS
- Framer Motion (Animations)
- Three.js / React Three Fiber (3D)
- Lucide React (Icons)
- React Intersection Observer

**Backend (Serverless):**
- Vercel Serverless Functions
- Groq API (Llama 3.3 70B)

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🚀 Deployment

1. Push to GitHub.
2. Import into [Vercel](https://vercel.com).
3. Add environment variable: `GROQ_API_KEY` (get one free at [console.groq.com](https://console.groq.com)).
4. Deploy — the AI chat agent works automatically via the `/api/chat` serverless function.

## 🔒 Security

- Environment variables used for all API keys.
- No secrets committed to the repository.
- `.env` is gitignored.

## 📄 License

All rights reserved. This project is proprietary. Unauthorized use, reproduction, or distribution without explicit permission is strictly prohibited.

---

Built by **Hetav Shah**.
