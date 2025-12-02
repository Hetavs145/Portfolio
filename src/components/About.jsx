import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Code, Database, Server, Cpu, Globe, Layers } from 'lucide-react';
import { useCursor } from '../context/CursorContext';

const About = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });
    const { setCursor, resetCursor } = useCursor();

    const skills = [
        "JavaScript (ES6+)",
        "React",
        "Node.js",
        "Python",
        "TensorFlow",
        "Three.js",
        "Tailwind CSS",
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
                            I build things that talk, react, adapt — and stay real-time.
                        </p>
                        <p className="text-slate mb-4">
                            From Firebase-backed systems to ML-driven gestures, from drone pathfinding to chat infrastructure, I love turning ideas into interactive, reliable software. I’ve worked on authentication pipelines, chatbot modules, and socket-powered communication systems, blending engineering with creativity.
                        </p>
                        <p className="text-slate mb-8">
                            If it’s a system that needs to think fast and respond faster — I’m in.
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

                    <div className="relative group">
                        <div className="relative z-10">
                            <div className="w-full h-full bg-teal-400/20 rounded absolute inset-0 group-hover:bg-transparent transition-colors duration-300"></div>
                            <div className="w-full aspect-square rounded overflow-hidden border-2 border-teal-400/50 group-hover:border-teal-400 transition-colors">
                                <img src="/profile.jpg" alt="Hetav Shah" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-300" />
                            </div>
                        </div>
                        <div className="absolute top-4 left-4 w-full h-full border-2 border-teal-400 rounded -z-10 group-hover:top-2 group-hover:left-2 transition-all duration-300"></div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default About;

