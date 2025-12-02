import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Briefcase } from 'lucide-react';

const ExperienceCard = ({ job, index }) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`mb-12 flex justify-between items-center w-full ${index % 2 === 0 ? 'flex-row-reverse' : ''
                }`}
        >
            <div className="order-1 w-5/12"></div>
            <div className="z-20 flex items-center order-1 bg-navy-800 shadow-xl w-12 h-12 rounded-full border-2 border-teal-400 justify-center">
                <Briefcase size={20} className="text-teal-400" />
            </div>
            <div className="order-1 w-5/12 px-6 py-4 bg-navy-800/50 backdrop-blur-sm rounded-lg border border-teal-400/20 shadow-lg hover:border-teal-400/50 transition-colors">
                <h3 className="mb-1 font-bold text-slate-lighter text-xl">{job.role}</h3>
                <h4 className="mb-2 font-mono text-teal-400 text-sm">{job.company}</h4>
                <p className="mb-4 text-sm text-slate-light font-mono">{job.period}</p>
                <ul className="list-disc list-inside text-slate text-sm space-y-2">
                    {job.description.map((desc, i) => (
                        <li key={i}>{desc}</li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
};

const Experience = () => {
    const jobs = [
        {
            role: "Full-Stack Developer Intern (Team Lead)",
            company: "NTS Global Nihon",
            period: "Jun 2025 – Aug 2025",
            description: [
                "Built real-time chat module with Socket.IO, presence sync, and message persistence.",
                "Implemented role-based authentication, error-handling flows, and Firestore rule security.",
                "Designed chatbot interaction workflows and integrated inference endpoints for Kaamigo.",
                "Contributed to UI improvements, onboarding flows, and multi-device app consistency.",
                "Collaborated on web + mobile integration, Git-based code reviews, and feature ownership."
            ]
        },
        {
            role: "ML + Full-Stack Intern (Team Lead)",
            company: "NTS Global Nihon",
            period: "Jun 2025 – Aug 2025",
            description: [
                "Designed inference workflows for a chatbot module (Kaamigo) using structured response pipelines.",
                "Built secure backend integrations using Firebase Functions & real-time Firestore event triggers.",
                "Optimized data validation and preprocessing in backend flows to ensure reliable model outputs.",
                "Collaborated on cross-functional ML + frontend integration for real-time interaction systems."
            ]
        },
        {
            role: "Software Engineering Intern",
            company: "NTS Global Nihon",
            period: "Jun 2025 – Aug 2025",
            description: [
                "Rebuilt authentication + onboarding flows using Firebase Auth & structured error handling, improved reliability across platforms.",
                "Developed real-time chat backend (Socket.IO + Firestore persistence) with online presence tracking & reconnection logic.",
                "Designed and implemented structured Firestore rules and backend schemas for multi-role app architecture.",
                "Built chatbot interaction pipelines and integrated inference endpoints for Kaamigo.",
                "Contributed to multi-team Git workflows, code reviews, and cross-platform integration."
            ]
        }
    ];

    return (
        <section id="experience" className="py-20 relative overflow-hidden">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="mb-16 flex items-center"
                >
                    <h2 className="text-3xl font-bold text-slate-lighter">Where I've Worked</h2>
                    <div className="h-px bg-navy-600 flex-grow ml-4"></div>
                </motion.div>

                <div className="relative wrap overflow-hidden p-10 h-full">
                    <div className="border-2-2 absolute border-opacity-20 border-teal-400 h-full border" style={{ left: '50%' }}></div>
                    {jobs.map((job, index) => (
                        <ExperienceCard key={index} job={job} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Experience;
