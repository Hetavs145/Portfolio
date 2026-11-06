import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, GraduationCap, Users } from 'lucide-react';
import { achievements } from '../data/achievements';
import SectionHeader from './SectionHeader';

/* The data module stores icon names rather than components, so that plain Node
   can import it when building the RAG index (lucide-react is ESM+JSX). */
const ICONS = { Trophy, Award, GraduationCap, Users };

/* Data keeps its original colour keys; they map onto the two accents here. */
const ACCENT = {
    amber: { text: 'text-hot', box: 'border-hot/40 bg-hot-soft/60' },
    teal: { text: 'text-arc-deep', box: 'border-arc/35 bg-arc-soft/60' },
    purple: { text: 'text-ink', box: 'border-ink/25 bg-ice-hi' },
};

const AchievementCell = ({ icon, title, subtitle, details, index, color = 'teal' }) => {
    const Icon = ICONS[icon] ?? Award;
    const a = ACCENT[color] ?? ACCENT.teal;

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: (index % 2) * 0.08 }}
            viewport={{ once: true, amount: 0.25 }}
            className="cell border-r border-b border-ink/20 p-6 sm:p-9"
        >
            <div className="flex items-start justify-between gap-4">
                <span className={`w-11 h-11 rounded-md border grid place-items-center ${a.box}`}>
                    <Icon size={20} strokeWidth={1.75} className={a.text} />
                </span>
                <span className="label text-ink-mute">C-{String(index + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="mt-6 text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] leading-[1.1] text-ink">{title}</h3>
            {subtitle && <p className={`label mt-2.5 leading-relaxed ${a.text}`}>{subtitle}</p>}
            {details && (
                <ul className="mt-4">
                    {details.map((d) => (
                        <li
                            key={d}
                            className="relative pl-7 py-2 border-b border-dashed border-ink/15 last:border-b-0 text-[15px] leading-relaxed text-ink-2"
                        >
                            <span className="absolute left-0 top-2 font-mono text-ink-mute" aria-hidden="true">→</span>
                            {d}
                        </li>
                    ))}
                </ul>
            )}
        </motion.article>
    );
};

const Achievements = () => (
    <section id="achievements" className="relative z-10 pt-28 md:pt-36">
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-[60px]">
            <SectionHeader mod="03" title="Credentials" meta="Awards · Education · Certs" />
            <div className="grid md:grid-cols-2 border-l border-ink/20">
                {achievements.map((item, index) => (
                    <AchievementCell key={item.title} {...item} index={index} />
                ))}
            </div>
        </div>
    </section>
);

export default Achievements;
