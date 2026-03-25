import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useCursor } from '../context/CursorContext';

const About = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });
    const { setCursor, resetCursor } = useCursor();

    const skills = [
        "JavaScript / TypeScript",
        "Python",
        "React / Next.js",
        "Node.js / FastAPI",
        "LangGraph / LangChain",
        "Groq / Gemini (LLMs)",
        "TensorFlow / PyTorch",
        "Firebase",
        "Docker",
        "Git"
    ];

    return (
        <section id="about" className="py-20 relative">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="grid md:grid-cols-2 gap-12 items-center"
                >
                    <div>
                        <div className="flex items-center mb-8">
                            <h2 className="text-3xl font-bold text-slate-lighter">About Me</h2>
                            <div className="h-px bg-navy-600 flex-grow ml-4"></div>
                        </div>

                        <p className="text-slate mb-4">
                            Full-stack developer and agentic AI engineer.
                        </p>
                        <p className="text-slate mb-4">
                            I build multi-agent LLM pipelines with LangGraph, production platforms with React & Node.js, and real-time systems that think fast and respond faster. From a 6-agent traffic command system to a full HVAC e-commerce platform — I love shipping things that actually work.
                        </p>
                        <p className="text-slate mb-8">
                            Hackathon winner. Strong in cross-functional teams. Always building.
                        </p>
                        <p className="text-slate mb-8">
                            Here are a few technologies I've been working with recently:
                        </p>

                        <ul className="grid grid-cols-2 gap-2 font-mono text-sm text-slate">
                            {skills.map((skill, index) => (
                                <li
                                    key={index}
                                    className="flex items-center"
                                    onMouseEnter={() => setCursor('skill', skill, ['Skill', 'Expertise'])}
                                    onMouseLeave={resetCursor}
                                >
                                    <span className="text-teal-400 mr-2">▹</span>
                                    {skill}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <motion.div
                        className="relative group flex justify-center items-center cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                        {/* Circular Ringified Aura */}
                        <motion.div
                            className="absolute z-0 w-[110%] h-[110%] rounded-full border-2 border-teal-400/60"
                            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="absolute z-0 w-[125%] h-[125%] rounded-full border-2 border-purple-500/50"
                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                        <motion.div
                            className="absolute z-0 w-[140%] h-[140%] rounded-full border-2 border-pink-500/40"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        />

                        <div className="relative z-10 w-full aspect-square rounded-2xl overflow-hidden border-2 border-teal-400 bg-navy-800">
                            {/* Main Image */}
                            <div className="w-full h-full relative z-20">
                                <img src="/Profile.png" alt="Hetav Shah" className="w-full h-full object-cover relative z-10" />

                                {/* Overlay Gradient for depth */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-teal-400/10 to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none z-20"></div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default About;
