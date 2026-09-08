import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useCursor } from '../context/CursorContext';
import { skills } from '../data/profile';

const About = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });
    const { setCursor, resetCursor } = useCursor();

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

                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-sm text-slate">
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
                        className="relative group flex justify-center items-center cursor-pointer select-none"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {/* Mechanical HUD Precision Aperture (Non-AI, Engineering Dial) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {/* Outer Precision Dial Image Rotating Slowly */}
                            <motion.img
                                src="/assets/suit/aperture.jpg"
                                alt="HUD Aperture Reticle"
                                className="w-[125%] h-[125%] max-w-none object-contain opacity-25 mix-blend-screen"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            />

                            {/* Crisp SVG Precision Mechanical Calipers & Degree Ticks */}
                            <svg className="absolute w-[118%] h-[118%] pointer-events-none" viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/10" />
                                <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 6" className="text-teal-400/30" />
                                <circle cx="100" cy="100" r="82" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 4" className="text-gold/20" />
                                
                                {/* 4 Crosshair Tick Marks */}
                                <line x1="100" y1="2" x2="100" y2="10" stroke="currentColor" strokeWidth="1.5" className="text-teal-400/60" />
                                <line x1="100" y1="190" x2="100" y2="198" stroke="currentColor" strokeWidth="1.5" className="text-teal-400/60" />
                                <line x1="2" y1="100" x2="10" y2="100" stroke="currentColor" strokeWidth="1.5" className="text-teal-400/60" />
                                <line x1="190" y1="100" x2="198" y2="100" stroke="currentColor" strokeWidth="1.5" className="text-teal-400/60" />

                                {/* Degree labels */}
                                <text x="100" y="16" fontSize="4" textAnchor="middle" fill="#38bdf8" fontFamily="monospace" opacity="0.7">000°</text>
                                <text x="185" y="102" fontSize="4" textAnchor="middle" fill="#8e98ab" fontFamily="monospace" opacity="0.6">090°</text>
                                <text x="100" y="186" fontSize="4" textAnchor="middle" fill="#8e98ab" fontFamily="monospace" opacity="0.6">180°</text>
                                <text x="15" y="102" fontSize="4" textAnchor="middle" fill="#8e98ab" fontFamily="monospace" opacity="0.6">270°</text>
                            </svg>

                            {/* Telemetry Corner Badges */}
                            <div className="absolute top-0 right-4 font-mono text-[9px] tracking-wider text-teal-400/60 uppercase border border-teal-400/20 px-1.5 py-0.5 rounded bg-navy-950/80 backdrop-blur-sm">
                                SYS // MARK-IV
                            </div>
                            <div className="absolute bottom-2 left-4 font-mono text-[9px] tracking-wider text-slate/60 uppercase border border-white/5 px-1.5 py-0.5 rounded bg-navy-950/80 backdrop-blur-sm">
                                FOCAL LOCK: 1.0
                            </div>
                        </div>

                        {/* Proper Circle Cropped Profile Container */}
                        <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full overflow-hidden border-2 border-teal-400/50 p-1 bg-navy-900/90 shadow-2xl transition-all duration-300 group-hover:border-teal-300">
                            <div className="w-full h-full rounded-full overflow-hidden relative">
                                <img
                                    src="/portfolio.jpeg"
                                    alt="Hetav Shah"
                                    width={600}
                                    height={600}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover object-[50%_18%] grayscale-[15%] group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                                />

                                {/* Subtle Technical Glaze */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-navy-900/40 via-transparent to-teal-400/10 opacity-40 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default About;
