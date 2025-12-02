import React from 'react';
import ProjectCard from './ProjectCard';

const Projects = () => {
    const projects = [
        {
            title: 'VaquaH',
            description: 'Full-Stack AC Services Platform. A comprehensive platform for booking and managing AC services.',
            tech: ['React', 'Node.js', 'Express', 'MongoDB'],
            live: 'https://vaquah.in',
            github: 'https://github.com/Hetavs145/VaquaH',
        },
        {
            title: 'Hetchat',
            description: 'Real-Time Chat App. Features real-time messaging, presence, and reconnection logic.',
            tech: ['React', 'Socket.IO', 'Node.js'],
            live: null,
            github: 'https://github.com/Hetavs145/Hetchat',
        },
        {
            title: 'Drone Path-Finder',
            description: 'Smart Delivery Drone Path-Finder Simulation. Optimizes delivery routes using advanced algorithms.',
            tech: ['Python', 'Algorithms', 'Simulation'],
            live: null,
            github: 'https://github.com/Hetavs145/Smart-Delivery-Drone-Path-Finder',
        },
        {
            title: 'Spam Detector',
            description: 'Spam Email Detection System using Machine Learning.',
            tech: ['Python', 'Scikit-learn', 'ML'],
            live: null,
            github: 'https://github.com/Hetavs145/Spam-Email-Detector',
        },
        {
            title: 'Sign2Text',
            description: 'Gesture Recognition System converting sign language to text.',
            tech: ['Python', 'OpenCV', 'TensorFlow'],
            live: null,
            github: 'https://github.com/Hetavs145/Sign2Text',
        },
        {
            title: 'Phishing Detector',
            description: 'ML-based Phishing Website Detection System.',
            tech: ['Python', 'ML', 'Cybersecurity'],
            live: null,
            github: 'https://github.com/Hetavs145/Phishing-detector',
        },
        {
            title: 'Kernel Scribe',
            description: 'Kernel Scribe Simulation.',
            tech: ['C', 'OS', 'Kernel'],
            live: null,
            github: 'https://github.com/Hetavs145/kernel-scribe-sim',
        },
        {
            title: 'Harzino Blog',
            description: 'Animated Blog platform with modern UI.',
            tech: ['React', 'Gatsby', 'Animation'],
            live: 'https://harzino.com',
            github: null,
        },
    ];

    return (
        <section id="work" className="py-20">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="flex items-center mb-12">
                    <span className="text-teal-400 font-mono text-xl mr-4">02.</span>
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
