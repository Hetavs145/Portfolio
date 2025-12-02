import React from 'react';
import { motion } from 'framer-motion';
import Background3D from './Background3D';
import MagneticButton from './MagneticButton';

const Hero = () => {
    return (
        <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
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
                        className="text-5xl md:text-7xl font-bold text-slate-lighter mb-4 tracking-tight glitch-effect"
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
                    <div className="text-slate text-lg leading-relaxed mb-4">
                        I build <span className="text-teal-400">Full-Stack systems</span>, <span className="text-teal-400">Real-Time apps</span>, and <span className="text-teal-400">Applied ML solutions</span>.
                    </div>
                    <div className="h-8 overflow-hidden relative">
                        <motion.div
                            animate={{ y: [0, -32, -64, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", times: [0, 0.33, 0.66, 1] }}
                            className="text-xl text-slate-light font-mono"
                        >
                            <div className="h-8 flex items-center">Full-Stack Developer</div>
                            <div className="h-8 flex items-center">Applied ML Engineer</div>
                            <div className="h-8 flex items-center">Real-Time Systems</div>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="flex space-x-6"
                >
                    <MagneticButton
                        href="#work"
                        className="border border-teal-400 text-teal-400 px-8 py-4 rounded hover:bg-teal-400/10 transition-colors font-mono text-sm inline-block"
                    >
                        Check out my work!
                    </MagneticButton>
                    <MagneticButton
                        href="/resume.pdf"
                        className="bg-teal-400 text-navy-900 px-8 py-4 rounded border border-teal-400 hover:bg-teal-300 transition-colors font-mono text-sm font-bold inline-block"
                    >
                        Get Resume
                    </MagneticButton>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
