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
        <section id="about" className="py-20 relative z-10">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="backdrop-blur-md bg-navy-900/80 border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative">
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
                            {/* Outer Precision Dial - Pure SVG Engineering HUD with zero raster background */}
                            <motion.svg
                                className="w-[124%] h-[124%] max-w-none pointer-events-none"
                                viewBox="0 0 240 240"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                            >
                                {/* Outer Technical Calibration Tracks */}
                                <circle cx="120" cy="120" r="114" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="0.8" strokeDasharray="4 8" />
                                <circle cx="120" cy="120" r="108" fill="none" stroke="rgba(217, 119, 6, 0.35)" strokeWidth="0.6" strokeDasharray="2 5" />
                                <circle cx="120" cy="120" r="102" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.5" />

                                {/* Cardinal Precision Reticle Brackets */}
                                <line x1="120" y1="4" x2="120" y2="15" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="120" y1="225" x2="120" y2="236" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="4" y1="120" x2="15" y2="120" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="225" y1="120" x2="236" y2="120" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />

                                {/* 45-Degree Telemetry Ticks */}
                                <line x1="39" y1="39" x2="47" y2="47" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" strokeLinecap="round" />
                                <line x1="201" y1="39" x2="193" y2="47" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" strokeLinecap="round" />
                                <line x1="39" y1="201" x2="47" y2="193" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" strokeLinecap="round" />
                                <line x1="201" y1="201" x2="193" y2="193" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" strokeLinecap="round" />

                                {/* Engineering Azimuth Degrees */}
                                <text x="120" y="24" fontSize="4.5" textAnchor="middle" fill="#38bdf8" fontFamily="monospace" opacity="0.8">000°</text>
                                <text x="218" y="122" fontSize="4.5" textAnchor="middle" fill="#94a3b8" fontFamily="monospace" opacity="0.7">090°</text>
                                <text x="120" y="221" fontSize="4.5" textAnchor="middle" fill="#94a3b8" fontFamily="monospace" opacity="0.7">180°</text>
                                <text x="22" y="122" fontSize="4.5" textAnchor="middle" fill="#94a3b8" fontFamily="monospace" opacity="0.7">270°</text>
                            </motion.svg>

                            {/* Inner Counter-Rotating Precision Ring */}
                            <motion.svg
                                className="absolute w-[114%] h-[114%] max-w-none pointer-events-none"
                                viewBox="0 0 200 200"
                                animate={{ rotate: -360 }}
                                transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
                            >
                                <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" strokeDasharray="16 32" />
                                <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" strokeDasharray="1 4" />
                            </motion.svg>

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
                                    className="w-full h-full object-cover object-[50%_63%] grayscale-[15%] group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                                />

                                {/* Subtle Technical Glaze */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-navy-900/40 via-transparent to-teal-400/10 opacity-40 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    </section>
    );
};

export default About;
