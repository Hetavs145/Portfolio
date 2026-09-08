import React from 'react';
import ProjectCard from './ProjectCard';
import { projects } from '../data/projects';

const Projects = () => {

    return (
        <section id="work" className="py-20">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="flex items-center mb-12">
                    <span className="text-teal-400 font-mono text-xl mr-4">03.</span>
                    <h2 className="text-3xl font-bold text-slate-lighter">Some Things I've Built</h2>
                    <div className="h-px bg-navy-600 flex-grow ml-4"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project, index) => (
                        <ProjectCard key={index} project={project} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Projects;
