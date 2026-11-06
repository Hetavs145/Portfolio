import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, ExternalLink, Youtube, Plus, Minus } from 'lucide-react';
import { useCursor } from '../context/CursorContext';
import ArchitectureDiagram from './ArchitectureDiagram';

const FEATURE_LABEL = {
    primary: { text: 'Flagship', className: 'text-hot' },
    secondary: { text: 'Featured', className: 'text-arc-deep' },
};

/** First sentence of the description, for the collapsed row. */
const summaryOf = (description) => {
    const m = description.match(/^.+?[.—](\s|$)/);
    const s = (m ? m[0] : description).replace(/\s*—\s*$/, '').trim();
    return s.length > 120 ? s.slice(0, 117).trimEnd() + '…' : s;
};

const LinkButton = ({ href, icon: Icon, children }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="btn-line h-10 px-3.5"
    >
        <Icon size={14} /> {children}
    </a>
);

/**
 * One row of the Work table. Collapsed: id, title, one-line summary, stack and
 * links. Clicking expands it in place to the full description, every tech tag
 * and the project's architecture diagram.
 */
const ProjectRow = ({ project, index, open, onToggle, diagram }) => {
    const { setCursor, resetCursor } = useCursor();
    const id = `P-${String(index + 1).padStart(2, '0')}`;
    const feature = FEATURE_LABEL[project.featured];
    const panelId = `project-panel-${index}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.04 }}
            viewport={{ once: true, amount: 0.2 }}
            className="border-r border-b border-ink/20"
            onMouseEnter={() => setCursor('project', project.title, project.tech)}
            onMouseLeave={resetCursor}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={panelId}
                className={`group w-full text-left grid grid-cols-[1fr_auto] lg:grid-cols-[84px_250px_1fr_280px_56px] items-center transition-colors duration-200 ${
                    open ? 'bg-ink text-ice-hi' : 'cell hover:bg-ice-hi/90'
                }`}
            >
                <span className={`hidden lg:block label px-6 py-6 ${open ? 'text-ice-2/60' : 'text-ink-mute'}`}>{id}</span>
                <span className="px-5 lg:px-6 pt-5 pb-1 lg:py-6 min-w-0">
                    <span className="flex items-center gap-3 lg:block">
                        <span className={`lg:hidden label shrink-0 whitespace-nowrap ${open ? 'text-ice-2/60' : 'text-ink-mute'}`}>{id}</span>
                        <span className="text-[22px] sm:text-2xl font-semibold tracking-[-0.03em] leading-tight">{project.title}</span>
                    </span>
                    {feature && (
                        <span className={`label block mt-1.5 ${open ? 'text-ice-2/80' : feature.className}`}>★ {feature.text}</span>
                    )}
                </span>
                <span className={`col-span-2 lg:col-span-1 row-start-2 lg:row-start-auto px-5 lg:px-6 pb-5 lg:py-6 text-[14.5px] leading-snug ${open ? 'text-ice-2/80' : 'text-ink-2'}`}>
                    {summaryOf(project.description)}
                </span>
                <span className="hidden lg:flex flex-wrap gap-1.5 px-6 py-6">
                    {project.tech.slice(0, 4).map((t) => (
                        <span key={t} className={`tag ${open ? 'border-ice-2/25 text-ice-2/85' : ''}`}>{t}</span>
                    ))}
                    {project.tech.length > 4 && (
                        <span className={`tag ${open ? 'border-ice-2/25 text-ice-2/85' : ''}`}>+{project.tech.length - 4}</span>
                    )}
                </span>
                <span className="row-start-1 col-start-2 lg:row-start-auto lg:col-start-auto pr-5 lg:pr-6 pt-5 lg:py-6 flex justify-end">
                    <span
                        className={`w-8 h-8 rounded-md border grid place-items-center transition-colors ${
                            open ? 'border-ice-2/40' : 'border-ink/30 group-hover:border-ink'
                        }`}
                        aria-hidden="true"
                    >
                        {open ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                </span>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id={panelId}
                        key="panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="cell grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                            <div className="p-5 sm:p-8 lg:border-r border-ink/20">
                                <div className="label text-ink-mute mb-3">Overview</div>
                                <p className="text-[16px] leading-relaxed text-ink-2">{project.description}</p>

                                <div className="label text-ink-mute mt-7 mb-3">Stack</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {project.tech.map((t) => (
                                        <span key={t} className="tag">{t}</span>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-7">
                                    {project.github && <LinkButton href={project.github} icon={Github}>Source</LinkButton>}
                                    {project.live && <LinkButton href={project.live} icon={ExternalLink}>Live</LinkButton>}
                                    {project.youtube && <LinkButton href={project.youtube} icon={Youtube}>Video</LinkButton>}
                                </div>
                            </div>
                            <div className="p-5 sm:p-8 border-t lg:border-t-0 border-ink/20 min-w-0">
                                {diagram ? (
                                    <ArchitectureDiagram figId={id} diagram={diagram} />
                                ) : (
                                    <p className="label text-ink-mute">No architecture diagram for this project.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ProjectRow;
