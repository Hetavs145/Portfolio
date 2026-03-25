import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Briefcase } from 'lucide-react';

const ExperienceCard = ({ job, index, isSingle }) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: isSingle ? 0 : (index % 2 === 0 ? -50 : 50), y: isSingle ? 20 : 0 }}
            animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`mb-12 flex flex-col md:flex-row items-center w-full 
                ${isSingle ? 'justify-center' : (index % 2 === 0 ? 'md:flex-row-reverse' : '')}`}
        >
            {!isSingle && <div className="order-1 w-full md:w-5/12 hidden md:block"></div>}

            <div className={`z-20 flex items-center order-1 bg-navy-800 shadow-xl w-12 h-12 rounded-full border-2 border-teal-400 justify-center 
                ${isSingle ? 'mb-4 md:mb-0 md:mr-6' : 'absolute left-8 md:static transform -translate-x-1/2 md:translate-x-0'}`}>
                <Briefcase size={20} className="text-teal-400" />
            </div>

            <div className={`order-1 px-6 py-4 bg-navy-800/50 backdrop-blur-sm rounded-lg border border-teal-400/20 shadow-lg hover:border-teal-400/50 transition-colors
                ${isSingle ? 'w-full md:w-8/12 text-center md:text-left' : 'w-full md:w-5/12 ml-16 md:ml-0'}`}>
                <h3 className="mb-1 font-bold text-slate-lighter text-xl">{job.role}</h3>
                <h4 className="mb-2 font-mono text-teal-400 text-sm">{job.company}</h4>
                <p className="mb-4 text-sm text-slate-light font-mono">{job.period}</p>
                <ul className={`list-disc list-inside text-slate text-sm space-y-2 ${isSingle ? 'inline-block text-left' : ''}`}>
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
            role: "Full-Stack Developer Intern – Team Lead",
            company: "NTS Global Nihon · Remote",
            period: "Jun 2025 – Aug 2025",
            description: [
                "Engineered 3 Firebase backend modules — Authentication, Firestore rules, and session management — across 2 production environments.",
                "Developed 5 Kaamigo chatbot modules using RAG-based approach with 50+ interaction flows, inference integration, and UI coordination.",
                "Shipped real-time chat supporting 3 platforms with message persistence and cross-device sync; reviewed 20+ pull requests via Git workflows."
            ]
        }
    ];

    const isSingle = jobs.length === 1;

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
                    {!isSingle && (
                        <div className="border-2-2 absolute border-opacity-20 border-teal-400 h-full border left-8 md:left-1/2 transform md:-translate-x-1/2"></div>
                    )}
                    {jobs.map((job, index) => (
                        <ExperienceCard key={index} job={job} index={index} isSingle={isSingle} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Experience;
