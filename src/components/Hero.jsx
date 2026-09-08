import React from 'react';
import { motion } from 'framer-motion';
import Background3D from './Background3D';
import MagneticButton from './MagneticButton';
import ResumeDropdown from './ResumeDropdown';
import { roles } from '../data/profile';

const Hero = () => {
    return (
        <section id="hero" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden py-24">
            <Background3D />

            <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h1 className="text-teal-400 font-mono text-lg mb-4">Hi, my name is</h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <h2
                        className="text-4xl sm:text-5xl md:text-7xl font-bold text-slate-lighter mb-4 tracking-tight glitch-effect"
                        data-text="Hetav Shah."
                    >
                        Hetav Shah.
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <h3
                        className="text-4xl md:text-6xl font-bold text-slate-light mb-8"
                        style={{ textShadow: '1px 1px 0 #000, 2px 2px 0 #000, 3px 3px 0 rgba(0,0,0,0.5)' }}
                    >
                        I build things for the web.
                    </h3>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="max-w-xl mb-10"
                >
                    <div
                        className="text-slate text-lg leading-relaxed mb-4"
                        style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 0 #000' }}
                    >
                        I build <span className="text-teal-400">Full-Stack systems</span>, <span className="text-teal-400">Agentic AI pipelines</span>, and <span className="text-teal-400">Real-Time apps</span>.
                    </div>
                    <div className="h-8 overflow-hidden relative">
                        {/* Keyframes are derived from `roles`, so adding a role to
                            src/data/profile.js is the only edit needed. Each item is
                            32px tall (h-8); the trailing 0 returns to the first. */}
                        <motion.div
                            animate={{ y: [...roles.map((_, i) => -32 * i), 0] }}
                            transition={{
                                duration: roles.length * 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                times: roles.map((_, i) => i / roles.length).concat(1),
                            }}
                            className="text-lg sm:text-xl text-slate-light font-mono"
                        >
                            {roles.map((role) => (
                                <div key={role} className="h-8 flex items-center">{role}</div>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6"
                >
                    <MagneticButton
                        href="#work"
                        className="border border-teal-400 text-teal-400 px-8 py-4 rounded hover:bg-teal-400/10 transition-colors font-mono text-sm inline-block text-center w-full sm:w-auto"
                    >
                        Check out my work!
                    </MagneticButton>
                    <ResumeDropdown />
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
