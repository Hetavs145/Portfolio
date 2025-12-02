import React from 'react';
import { motion } from 'framer-motion';
import { Github, ExternalLink, Folder } from 'lucide-react';
import { useCursor } from '../context/CursorContext';

const ProjectCard = ({ project, index }) => {
    const { setCursor, resetCursor } = useCursor();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="bg-navy-800 rounded-lg p-6 hover:-translate-y-2 transition-transform duration-300 border border-teal-400/10 hover:border-teal-400/30 group"
            onMouseEnter={() => setCursor('project', project.title, project.tech)}
            onMouseLeave={resetCursor}
        >
            <div className="flex justify-between items-center mb-6">
                <div className="text-teal-400">
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

            <h3 className="text-xl font-bold text-slate-lighter mb-2 group-hover:text-teal-400 transition-colors">
                {project.title}
            </h3>

            <p className="text-slate-light mb-4 text-sm">
                {project.description}
            </p>

            <ul className="flex flex-wrap gap-2 mt-auto text-xs font-mono text-slate-500">
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
