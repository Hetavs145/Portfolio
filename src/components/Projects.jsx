import React, { useState } from 'react';
import ProjectRow, { ROW_GRID } from './ProjectRow';
import SectionHeader from './SectionHeader';
import { projects } from '../data/projects';
import { architectures } from '../data/architectures';

const production = projects.filter((p) => p.production);
const others = projects.filter((p) => !p.production);

const GroupLabel = ({ children, count }) => (
    <div className="border-r border-b border-ink/20 bg-ice-2/70 px-5 lg:px-6 py-2.5 flex justify-between label">
        <span className="text-ink">{children}</span>
        <span className="text-ink-mute">{String(count).padStart(2, '0')}</span>
    </div>
);

const Projects = () => {
    // One production row open at a time; the flagship starts open so the
    // expand affordance is obvious on first visit.
    const [openTitle, setOpenTitle] = useState(production[0]?.title ?? null);

    const renderRow = (project) => {
        const index = projects.indexOf(project);
        return (
            <ProjectRow
                key={project.title}
                project={project}
                index={index}
                diagram={architectures[project.title]}
                open={openTitle === project.title}
                onToggle={() => setOpenTitle(openTitle === project.title ? null : project.title)}
            />
        );
    };

    return (
        <section id="work" className="relative z-10 pt-28 md:pt-36">
            <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-[60px]">
                <SectionHeader
                    mod="04"
                    title="Work"
                    meta={`${projects.length} builds · production rows expand`}
                />

                <div className="border-l border-ink/20">
                    <div className={`hidden lg:grid ${ROW_GRID} border-r border-b border-ink/20 label text-ink-mute`}>
                        <span className="px-6 py-3">ID</span>
                        <span className="px-6 py-3">Project</span>
                        <span className="px-6 py-3">Summary</span>
                        <span className="px-6 py-3">Stack</span>
                        <span className="px-6 py-3 text-right">Links</span>
                    </div>

                    <GroupLabel count={production.length}>Production</GroupLabel>
                    {production.map(renderRow)}

                    <GroupLabel count={others.length}>Other builds</GroupLabel>
                    {others.map(renderRow)}
                </div>
            </div>
        </section>
    );
};

export default Projects;
