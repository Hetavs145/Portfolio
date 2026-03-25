import React from 'react';
import ProjectCard from './ProjectCard';

const Projects = () => {
    const projects = [
        {
            title: 'VaquaH Cooling Service',
            description: 'Full-stack HVAC/Cooling services platform — e-commerce with 50+ products, smart search, coupon system, tiered shipping, wishlist, Razorpay & COD checkout. Includes service booking, AMC plans, appointment tracking, user dashboard, RAG-powered AI chatbot, hands-free voice assistant ("Say VaquaH"), and gesture navigation with virtual cursor, pinch-to-click, and swipe via MediaPipe.',
            tech: ['React (Vite)', 'Tailwind CSS', 'Node.js', 'Express', 'Firebase', 'Razorpay', 'Google Generative AI', 'MediaPipe', 'Framer Motion'],
            live: 'https://vaquah.in',
            github: 'https://github.com/Hetavs145/VaquaH',
            featured: 'primary',
        },
        {
            title: 'TrafficMind',
            description: '6-agent LangGraph multi-agent system for traffic incident command. Parallel fan-out/fan-in orchestration, 250-segment live road network, sub-0.34s response, Digital Twin view, DBSCAN hotspot prediction, and voice chat.',
            tech: ['LangGraph', 'FastAPI', 'Next.js', 'Groq', 'Gemini', 'WebSocket'],
            live: null,
            github: 'https://github.com/Hetavs145/TrafficMind',
            featured: 'secondary',
        },
        {
            title: 'YouTube Upload Automation',
            description: 'n8n agentic workflow automating daily YouTube uploads from Google Drive. 90% reduced manual time with LLM-based metadata auto-generation and 100% field compliance.',
            tech: ['n8n', 'Google Drive API', 'Google Sheets API', 'LLM'],
            live: null,
            github: 'https://github.com/Hetavs145/YouTube-Upload-Agent',
            featured: null,
        },
        {
            title: 'Sign2Text',
            description: 'Real-time ASL gesture-to-text recognition using MediaPipe hand landmarks and CNN-LSTM sequence model for 26 gestures with smoothing and windowing.',
            tech: ['Python', 'MediaPipe', 'CNN-LSTM', 'TensorFlow'],
            live: null,
            github: 'https://github.com/Hetavs145/Sign2Text',
            featured: null,
        },
        {
            title: 'Hetchat',
            description: 'Real-Time Chat App with live messaging, presence indicators, and reconnection logic.',
            tech: ['React', 'Socket.IO', 'Node.js'],
            live: null,
            github: 'https://github.com/Hetavs145/Hetchat',
            featured: null,
        },
        {
            title: 'Drone Path-Finder',
            description: 'Smart Delivery Drone Path-Finder Simulation. Optimizes delivery routes using advanced algorithms.',
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
            description: 'Kernel Scribe Simulation.',
            tech: ['C', 'OS', 'Kernel'],
            live: null,
            github: 'https://github.com/Hetavs145/kernel-scribe-sim',
            featured: null,
        },
        {
            title: 'Harzino Blog',
            description: 'Animated Blog platform with modern UI.',
            tech: ['React', 'Gatsby', 'Animation'],
            live: 'https://harzino.com',
            github: null,
            featured: null,
        },
    ];

    return (
        <section id="work" className="py-20">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="flex items-center mb-12">
                    <span className="text-teal-400 font-mono text-xl mr-4">03.</span>
                    <h2 className="text-3xl font-bold text-slate-lighter">Some Things I've Built</h2>
                    <div className="h-px bg-navy-600 flex-grow ml-4"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project, index) => (
                        <ProjectCard key={index} project={project} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Projects;
