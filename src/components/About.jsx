import React from 'react';
import { motion } from 'framer-motion';
import { useCursor } from '../context/CursorContext';
import { skills } from '../data/profile';
import SectionHeader from './SectionHeader';

/**
 * The arc-reactor aperture around the profile photo: two counter-rotating
 * engineering dials and telemetry badges. Same construction as before,
 * re-inked for the light theme.
 */
const ArcAperture = () => (
    <motion.div
        className="relative group flex justify-center items-center cursor-pointer select-none py-14 sm:py-16"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Outer precision dial */}
            <motion.svg
                className="w-[min(124%,420px)] aspect-square max-w-none pointer-events-none"
                viewBox="0 0 240 240"
                animate={{ rotate: 360 }}
                transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
            >
                <circle cx="120" cy="120" r="114" fill="none" stroke="rgba(14,141,181,0.45)" strokeWidth="0.8" strokeDasharray="4 8" />
                <circle cx="120" cy="120" r="108" fill="none" stroke="rgba(217,65,42,0.45)" strokeWidth="0.6" strokeDasharray="2 5" />
                <circle cx="120" cy="120" r="102" fill="none" stroke="rgba(13,17,23,0.18)" strokeWidth="0.5" />

                {/* Cardinal reticle brackets */}
                <line x1="120" y1="4" x2="120" y2="15" stroke="#0D1117" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="120" y1="225" x2="120" y2="236" stroke="#0D1117" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="4" y1="120" x2="15" y2="120" stroke="#0D1117" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="225" y1="120" x2="236" y2="120" stroke="#0D1117" strokeWidth="1.5" strokeLinecap="round" />

                {/* 45° telemetry ticks */}
                <line x1="39" y1="39" x2="47" y2="47" stroke="rgba(14,141,181,0.7)" strokeWidth="1" strokeLinecap="round" />
                <line x1="201" y1="39" x2="193" y2="47" stroke="rgba(14,141,181,0.7)" strokeWidth="1" strokeLinecap="round" />
                <line x1="39" y1="201" x2="47" y2="193" stroke="rgba(14,141,181,0.7)" strokeWidth="1" strokeLinecap="round" />
                <line x1="201" y1="201" x2="193" y2="193" stroke="rgba(14,141,181,0.7)" strokeWidth="1" strokeLinecap="round" />

                {/* Azimuth degrees */}
                <text x="120" y="24" fontSize="4.5" textAnchor="middle" fill="#0B6E8E" fontFamily="JetBrains Mono, monospace">000°</text>
                <text x="218" y="122" fontSize="4.5" textAnchor="middle" fill="#66717F" fontFamily="JetBrains Mono, monospace">090°</text>
                <text x="120" y="221" fontSize="4.5" textAnchor="middle" fill="#66717F" fontFamily="JetBrains Mono, monospace">180°</text>
                <text x="22" y="122" fontSize="4.5" textAnchor="middle" fill="#66717F" fontFamily="JetBrains Mono, monospace">270°</text>
            </motion.svg>

            {/* Inner counter-rotating ring */}
            <motion.svg
                className="absolute w-[min(114%,386px)] aspect-square max-w-none pointer-events-none"
                viewBox="0 0 200 200"
                animate={{ rotate: -360 }}
                transition={{ duration: 65, repeat: Infinity, ease: 'linear' }}
            >
                <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(14,141,181,0.4)" strokeWidth="1" strokeDasharray="16 32" />
                <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(13,17,23,0.14)" strokeWidth="0.5" strokeDasharray="1 4" />
            </motion.svg>
        </div>

        {/* Telemetry badges */}
        <span className="absolute top-4 right-4 label text-[9.5px] text-arc-deep border border-arc/30 px-1.5 py-0.5 rounded bg-ice-hi/90">
            SYS // MARK-IV
        </span>
        <span className="absolute bottom-4 left-4 label text-[9.5px] text-ink-mute border border-ink/15 px-1.5 py-0.5 rounded bg-ice-hi/90">
            FOCAL LOCK: 1.0
        </span>

        {/* Circle-cropped profile */}
        <div className="relative z-10 w-60 h-60 sm:w-72 sm:h-72 rounded-full overflow-hidden border-2 border-ink/80 p-1 bg-ice-hi shadow-[0_30px_60px_-30px_rgba(13,17,23,0.45)] transition-colors duration-300 group-hover:border-arc">
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
            </div>
        </div>
    </motion.div>
);

const About = () => {
    const { setCursor, resetCursor } = useCursor();

    return (
        <section id="about" className="relative z-10 pt-28 md:pt-36">
            <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-[60px]">
                <SectionHeader mod="01" title="Profile" meta="B.Tech CSE + MBA · Nirma" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true, amount: 0.15 }}
                    className="grid lg:grid-cols-2 border-l border-ink/20"
                >
                    <div className="cell border-r border-b border-ink/20 p-6 sm:p-9">
                        <p className="text-xl sm:text-2xl leading-[1.45] tracking-[-0.015em] text-ink mb-5">
                            Full-stack developer and agentic AI engineer. I build multi-agent LLM pipelines with
                            LangGraph, production platforms with React &amp; Node.js, and real-time systems that
                            think fast and respond faster.
                        </p>
                        <p className="text-base sm:text-lg leading-relaxed text-ink-2 mb-4">
                            From a 6-agent traffic command system to a full HVAC e-commerce platform — I love shipping
                            things that actually work.
                        </p>
                        <p className="text-base sm:text-lg leading-relaxed text-ink-2">
                            Hackathon winner. Strong in cross-functional teams. Always building.
                        </p>

                        <div className="label text-ink-mute mt-9 mb-1">Working with recently</div>
                        <ul className="grid sm:grid-cols-2 sm:gap-x-6">
                            {skills.map((skill, index) => (
                                <li
                                    key={skill}
                                    className="flex justify-between items-center gap-3 py-3 border-b border-dashed border-ink/20 text-[15px] text-ink"
                                    onMouseEnter={() => setCursor('skill', skill, ['Skill', 'Expertise'])}
                                    onMouseLeave={resetCursor}
                                >
                                    <span>{skill}</span>
                                    <span className="label text-ink-mute">{String(index + 1).padStart(2, '0')}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="cell border-r border-b border-ink/20 relative overflow-hidden flex items-center justify-center min-h-[420px]">
                        <span className="absolute left-4 top-4 label text-ink-mute">IMG_001 · Subject: Hetav</span>
                        <ArcAperture />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default About;
