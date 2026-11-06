import React, { useState } from 'react';
import ProjectRow from './ProjectRow';
import SectionHeader from './SectionHeader';
import { projects } from '../data/projects';
import { architectures } from '../data/architectures';

const Projects = () => {
    // One row open at a time; the flagship starts open so the expand
    // affordance is obvious on first visit.
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section id="work" className="relative z-10 pt-28 md:pt-36">
            <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-[60px]">
                <SectionHeader
                    mod="04"
                    title="Work"
                    meta={`${projects.length} builds · click a row to expand`}
                />

                <div className="border-l border-ink/20">
                    <div className="hidden lg:grid grid-cols-[84px_250px_1fr_280px_56px] border-r border-b border-ink/20 label text-ink-mute">
                        <span className="px-6 py-3">ID</span>
                        <span className="px-6 py-3">Project</span>
                        <span className="px-6 py-3">Summary</span>
                        <span className="px-6 py-3">Stack</span>
                        <span />
                    </div>
                    {projects.map((project, index) => (
                        <ProjectRow
                            key={project.title}
                            project={project}
                            index={index}
                            diagram={architectures[project.title]}
                            open={openIndex === index}
                            onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Projects;
