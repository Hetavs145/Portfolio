import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Trophy, Award, GraduationCap, BookOpen } from 'lucide-react';

const AchievementCard = ({ icon: Icon, title, subtitle, details, index, color = 'teal' }) => {
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

    const colorMap = {
        teal: { border: 'border-teal-400/30 hover:border-teal-400/70', bg: 'bg-teal-400/10', text: 'text-teal-400', glow: 'shadow-teal-400/20' },
        amber: { border: 'border-amber-400/30 hover:border-amber-400/70', bg: 'bg-amber-400/10', text: 'text-amber-400', glow: 'shadow-amber-400/20' },
        purple: { border: 'border-purple-400/30 hover:border-purple-400/70', bg: 'bg-purple-400/10', text: 'text-purple-400', glow: 'shadow-purple-400/20' },
    };

    const c = colorMap[color];

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className={`bg-navy-800 rounded-lg p-6 border ${c.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${c.glow}`}
        >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${c.bg} mb-4`}>
                <Icon size={24} className={c.text} />
            </div>
            <h3 className="text-lg font-bold text-slate-lighter mb-1">{title}</h3>
            {subtitle && <p className={`text-sm font-mono ${c.text} mb-3`}>{subtitle}</p>}
            {details && (
                <ul className="text-slate text-sm space-y-2">
                    {details.map((d, i) => (
                        <li key={i} className="flex items-start">
                            <span className={`${c.text} mr-2 mt-1 flex-shrink-0`}>▹</span>
                            <span>{d}</span>
                        </li>
                    ))}
                </ul>
            )}
        </motion.div>
    );
};

const Achievements = () => {
    const achievements = [
        {
            icon: Trophy,
            title: 'Hackathon Winner — 1st Place',
            subtitle: 'Team 2AM Coders · March 21–22, 2026',
            color: 'amber',
            details: [
                'Won 1st place at first-ever hackathon — 36 hours of non-stop building.',
                'Presented TrafficMind to 8+ judges and mentors, praised across both evaluation rounds and final panel.',
                'Only team recognized across all 3 phases — Phase 1 discussions, mentor evaluations, and final judge presentations.',
            ],
        },
        {
            icon: GraduationCap,
            title: 'Education',
            subtitle: 'Nirma University · Expected May 2028',
            color: 'teal',
            details: [
                'Integrated B.Tech in Computer Science & Engineering + MBA',
                'Institute of Technology, Nirma University, Ahmedabad',
                'CGPA: 7.04 / 10',
            ],
        },
        {
            icon: Award,
            title: 'Certifications',
            subtitle: null,
            color: 'purple',
            details: [
                'Cloud Foundations — AWS Academy',
                'Intro to LangGraph — Simplilearn',
                'n8n: No Code AI Agent Builder — Simplilearn',
                'Full Stack Development — NTS Global Nihon',
                'C Programming — Coursera',
            ],
        },
    ];

    return (
        <section id="achievements" className="py-20 relative">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="flex items-center mb-12"
                >
                    <span className="text-teal-400 font-mono text-xl mr-4">02.</span>
                    <h2 className="text-3xl font-bold text-slate-lighter">Achievements</h2>
                    <div className="h-px bg-navy-600 flex-grow ml-4"></div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {achievements.map((item, index) => (
                        <AchievementCard key={index} {...item} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Achievements;
