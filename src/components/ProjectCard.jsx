import React from 'react';
import { motion } from 'framer-motion';
import { Github, ExternalLink, Folder, Star, Zap } from 'lucide-react';
import { useCursor } from '../context/CursorContext';

const ProjectCard = ({ project, index }) => {
    const { setCursor, resetCursor } = useCursor();

    const isPrimary = project.featured === 'primary';
    const isSecondary = project.featured === 'secondary';

    const cardClasses = isPrimary
        ? 'bg-navy-800 rounded-lg p-6 hover:-translate-y-2 transition-all duration-300 border-2 border-amber-400/50 hover:border-amber-400 group shadow-lg shadow-amber-400/10 hover:shadow-amber-400/20 relative overflow-hidden'
        : isSecondary
            ? 'bg-navy-800 rounded-lg p-6 hover:-translate-y-2 transition-all duration-300 border-2 border-teal-400/40 hover:border-teal-400 group shadow-lg shadow-teal-400/10 hover:shadow-teal-400/20 relative overflow-hidden'
            : 'bg-navy-800 rounded-lg p-6 hover:-translate-y-2 transition-transform duration-300 border border-teal-400/10 hover:border-teal-400/30 group';

    const iconColor = isPrimary ? 'text-amber-400' : 'text-teal-400';
    const titleHoverColor = isPrimary ? 'group-hover:text-amber-400' : 'group-hover:text-teal-400';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className={cardClasses}
            onMouseEnter={() => setCursor('project', project.title, project.tech)}
            onMouseLeave={resetCursor}
        >
            {/* Featured badge */}
            {isPrimary && (
                <div className="absolute top-0 right-0 bg-amber-400 text-navy-900 text-xs font-bold font-mono px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <Star size={12} /> FEATURED
                </div>
            )}
            {isSecondary && (
                <div className="absolute top-0 right-0 bg-teal-400 text-navy-900 text-xs font-bold font-mono px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <Zap size={12} /> FEATURED
                </div>
            )}

            {/* Glow effect for featured cards */}
            {isPrimary && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent pointer-events-none" />
            )}
            {isSecondary && (
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-transparent pointer-events-none" />
            )}

            <div className="flex justify-between items-center mb-6 relative">
                <div className={iconColor}>
                    <Folder size={40} />
                </div>
                <div className="flex space-x-4 text-slate-light">
                    {project.github && (
                        <a href={project.github} target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
                            <Github size={20} />
                        </a>
                    )}
                    {project.live && (
                        <a href={project.live} target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">
                            <ExternalLink size={20} />
                        </a>
                    )}
                </div>
            </div>

            <h3 className={`text-xl font-bold text-slate-lighter mb-2 ${titleHoverColor} transition-colors relative`}>
                {project.title}
            </h3>

            <p className="text-slate-light mb-4 text-sm relative">
                {project.description}
            </p>

            <ul className="flex flex-wrap gap-2 mt-auto text-xs font-mono text-slate-500 relative">
                {project.tech.map((tech) => (
                    <li key={tech} className="mr-2 mb-1">
                        {tech}
                    </li>
                ))}
            </ul>
        </motion.div>
    );
};

export default ProjectCard;
