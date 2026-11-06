import React from 'react';
import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';

const jobs = [
    {
        role: 'Full-Stack Developer Intern — Team Lead',
        company: 'NTS Global Nihon',
        location: 'Remote',
        period: '2025.06 → 2025.08',
        description: [
            'Engineered 3 Firebase backend modules — Authentication, Firestore rules, and session management — across 2 production environments.',
            'Developed 5 Kaamigo chatbot modules using RAG-based approach with 50+ interaction flows, inference integration, and UI coordination.',
            'Shipped real-time chat supporting 3 platforms with message persistence and cross-device sync; reviewed 20+ pull requests via Git workflows.',
        ],
    },
];

const Experience = () => (
    <section id="experience" className="relative z-10 pt-28 md:pt-36">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-[60px]">
            <SectionHeader
                mod="02"
                title="Internship"
                meta={`${String(jobs.length).padStart(2, '0')} ${jobs.length === 1 ? 'entry' : 'entries'}`}
            />

            <div className="border-l border-ink/20">
                {jobs.map((job, index) => (
                    <motion.article
                        key={job.role}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        className="cell grid lg:grid-cols-[220px_1fr_1.1fr] border-r border-b border-ink/20"
                    >
                        <div className="p-6 sm:px-9 sm:py-8 label leading-[1.9]">
                            <span className="block text-ink-mute">{job.period}</span>
                            <span className="block text-ink">{job.location}</span>
                        </div>
                        <div className="px-6 pb-2 sm:px-9 lg:py-8 lg:border-l border-ink/20">
                            <h3 className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.03em] leading-[1.08] text-ink">
                                {job.role}
                            </h3>
                            <div className="label text-arc-deep mt-3">{job.company}</div>
                        </div>
                        <ul className="p-6 sm:px-9 sm:py-8 lg:border-l border-ink/20">
                            {job.description.map((d) => (
                                <li
                                    key={d}
                                    className="relative pl-7 py-2.5 border-b border-dashed border-ink/15 last:border-b-0 text-[15.5px] leading-relaxed text-ink-2"
                                >
                                    <span className="absolute left-0 top-2.5 font-mono text-arc-deep" aria-hidden="true">→</span>
                                    {d}
                                </li>
                            ))}
                        </ul>
                    </motion.article>
                ))}
            </div>
        </div>
    </section>
);

export default Experience;
