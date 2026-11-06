import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Github, Linkedin, Instagram, Youtube, CornerDownLeft } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { useRoute } from '../context/RouteContext';
import { PENDING_QUESTION_KEY } from '../data/agent';

const contactChannels = [
    {
        id: 'mail',
        name: 'Email',
        label: 'hetavs145@gmail.com',
        href: "mailto:hetavs145@gmail.com?subject=Let's%20Connect&body=Hi%20Hetav,%0D%0A%0D%0AI%20would%20like%20to%20connect%20with%20you.",
        icon: Mail,
        angle: -145, // Upper Left
    },
    {
        id: 'github',
        name: 'GitHub',
        label: 'github.com/Hetavs145',
        href: 'https://github.com/Hetavs145',
        icon: Github,
        angle: -180, // Middle Left
    },
    {
        id: 'instagram',
        name: 'Instagram',
        label: '@hetav.shah145',
        href: 'https://www.instagram.com/hetav.shah145/',
        icon: Instagram,
        angle: -215, // Lower Left
    },
    {
        id: 'phone',
        name: 'Call',
        label: '+91 8200135258',
        href: 'tel:+918200135258',
        icon: Phone,
        angle: -35, // Upper Right
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        label: 'linkedin.com/in/hetav-shah',
        href: 'https://www.linkedin.com/in/hetav-shah-26601722b/',
        icon: Linkedin,
        angle: 0, // Middle Right
    },
    {
        id: 'youtube',
        name: 'YouTube',
        label: '@NeuroStucks',
        href: 'https://www.youtube.com/@NeuroStucks',
        icon: Youtube,
        angle: 35, // Lower Right
    }
];

const SUGGESTIONS = [
    'What did you build at Aetrix?',
    'What is your tech stack?',
    'Are you open to internships?',
];

/** "Send a signal" — hands a question to the Ask Hetav agent page. */
const SignalPrompt = () => {
    const { setCurrentPage } = useRoute();
    const [q, setQ] = useState('');

    const ask = (text) => {
        const question = text.trim();
        if (!question) return;
        try {
            sessionStorage.setItem(PENDING_QUESTION_KEY, question);
        } catch {}
        setCurrentPage('agent');
        window.scrollTo(0, 0);
    };

    return (
        <div>
            <form
                onSubmit={(e) => { e.preventDefault(); ask(q); }}
                className="flex items-center gap-2 rounded-xl border border-ink/20 bg-ice-hi pl-4 pr-1.5 py-1.5 focus-within:border-ink"
            >
                <span className="font-mono text-sm text-ink-mute" aria-hidden="true">&gt;</span>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="ask hetav anything about my work"
                    aria-label="Ask Hetav a question"
                    className="flex-1 min-w-0 bg-transparent font-mono text-sm text-ink placeholder:text-ink-mute focus:outline-none py-2"
                />
                <button type="submit" className="btn-ink h-10 px-4">
                    Enter <CornerDownLeft size={13} />
                </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-3">
                {SUGGESTIONS.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => ask(s)}
                        className="font-mono text-[11.5px] px-3 py-1.5 rounded-md border border-ink/15 text-ink-2 hover:border-ink hover:text-ink transition-colors"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
};

const Contact = () => {
    const [isNear, setIsNear] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState(null);
    const hubRef = useRef(null);
    const lastToggleTime = useRef(0);

    // Reliable debounced toggle ensuring tap always works and never double-fires
    const toggleNear = (forceVal) => {
        const now = performance.now();
        if (now - lastToggleTime.current < 450) return;
        lastToggleTime.current = now;
        setIsNear(prev => (typeof forceVal === 'boolean' ? forceVal : !prev));
    };

    useEffect(() => {
        const mq = window.matchMedia('(pointer: coarse)');
        const updateTouch = () => {
            setIsTouch(mq.matches || 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
        };
        updateTouch();
        mq.addEventListener('change', updateTouch);

        // Listen for touch event dispatched from Background3D when robot or Arc Reactor is tapped on mobile
        const handleRoboTouch = () => {
            toggleNear();
        };
        window.addEventListener('robo-touch', handleRoboTouch);

        // Mouse proximity detection for desktop
        const handleWindowMouseMove = (e) => {
            if (isTouch || !hubRef.current) return;
            const rect = hubRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);

            if (dist < 280) {
                setIsNear(true);
            } else if (dist > 350) {
                setIsNear(false);
            }
        };

        window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });

        return () => {
            mq.removeEventListener('change', updateTouch);
            window.removeEventListener('robo-touch', handleRoboTouch);
            window.removeEventListener('mousemove', handleWindowMouseMove);
        };
    }, [isTouch]);

    // Orbital radius: 215px on desktop, 140px on mobile
    const getCoordinates = (angle) => {
        const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 640;
        const radius = isMobileScreen ? 140 : 215;
        const rad = (angle * Math.PI) / 180;
        return {
            x: Math.round(radius * Math.cos(rad)),
            y: Math.round(radius * Math.sin(rad))
        };
    };

    return (
        <section
            id="contact"
            // contact-dock: bottom padding that keeps the arc-reactor hub
            // centred on the robot's chest at the end of the page (index.css).
            className="contact-dock relative z-10 pt-28 md:pt-36"
        >
            <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-[60px]">
                <SectionHeader mod="05" title="Contact" meta="Open channel" />

                {/* Send a signal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true, amount: 0.25 }}
                    className="grid lg:grid-cols-[1.25fr_1fr] border-l border-ink/20"
                >
                    <div className="cell border-r border-b border-ink/20 p-6 sm:p-10">
                        <h3 className="text-[64px] sm:text-[88px] font-semibold tracking-display leading-[0.88] text-ink">
                            Send a<br />signal.
                        </h3>
                        <p className="mt-6 max-w-md text-base sm:text-lg leading-relaxed text-ink-2">
                            I’m currently looking for new opportunities, and my inbox is always open. Whether you have
                            a question or just want to say hi, I’ll try my best to get back to you.
                        </p>
                        <div className="label mt-6 flex flex-wrap gap-x-4 gap-y-1">
                            <a href="mailto:hetavs145@gmail.com" className="text-ink hover:text-arc-deep">hetavs145@gmail.com</a>
                            <a href="tel:+918200135258" className="text-ink-mute hover:text-arc-deep">+91 82001 35258</a>
                        </div>
                    </div>
                    <div className="cell border-r border-b border-ink/20 p-6 sm:p-10 flex flex-col justify-end gap-5">
                        <div>
                            <div className="label text-ink">Ask my AI twin</div>
                            <p className="label text-ink-mute mt-1.5 normal-case tracking-normal text-[12.5px]">
                                A RAG agent over my résumé, GitHub and LinkedIn.
                            </p>
                        </div>
                        <SignalPrompt />
                    </div>
                </motion.div>

                {/* Arc-reactor hub: channels bloom around the robot's chest */}
                <div className="text-center mt-24 sm:mt-28">

                    <div
                        ref={hubRef}
                        className="relative w-full max-w-lg h-80 sm:h-96 mx-auto flex items-center justify-center select-none"
                        onMouseEnter={() => !isTouch && setIsNear(true)}
                        onMouseLeave={() => !isTouch && setIsNear(false)}
                        onClick={() => toggleNear()}
                    >
                        {/* Centre prompt */}
                        <div
                            className={`flex flex-col items-center gap-2 transition-all duration-500 cursor-pointer ${
                                isNear ? 'opacity-35 scale-95' : 'opacity-100 scale-100'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleNear();
                                }}
                                onTouchEnd={(e) => {
                                    e.stopPropagation();
                                    toggleNear();
                                }}
                                aria-label="Tap Arc Reactor to reveal or hide channels"
                                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-ice-hi/90 border border-arc/50 hover:border-arc backdrop-blur-md shadow-[0_10px_30px_-12px_rgba(14,141,181,0.55)] active:scale-95 transition-all cursor-pointer select-none"
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-arc opacity-60"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-arc"></span>
                                </span>
                                <span className="label text-arc-deep">
                                    {isTouch
                                        ? (isNear ? 'tap arc reactor to hide' : 'tap on arc reactor')
                                        : (isNear ? 'move cursor away to hide' : 'move cursor near arc reactor')}
                                </span>
                            </button>
                        </div>

                        {/* Orbital channels */}
                        {contactChannels.map((item, index) => {
                            const coords = getCoordinates(item.angle);
                            const floatOffset = (index % 2 === 0 ? 1 : -1) * 6;

                            return (
                                <motion.a
                                    key={item.id}
                                    href={item.href}
                                    target={item.href.startsWith('mailto:') || item.href.startsWith('tel:') ? '_self' : '_blank'}
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                                    animate={isNear ? {
                                        scale: 1,
                                        opacity: 1,
                                        x: coords.x,
                                        y: [coords.y, coords.y + floatOffset, coords.y],
                                    } : {
                                        scale: 0,
                                        opacity: 0,
                                        x: 0,
                                        y: 0,
                                    }}
                                    transition={isNear ? {
                                        x: { type: 'spring', stiffness: 280, damping: 22, delay: index * 0.04 },
                                        scale: { type: 'spring', stiffness: 280, damping: 22, delay: index * 0.04 },
                                        opacity: { duration: 0.3, delay: index * 0.04 },
                                        y: { duration: 3.2 + index * 0.3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.1 }
                                    } : {
                                        duration: 0.25
                                    }}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.92 }}
                                    onMouseEnter={() => setActiveTooltip(item.id)}
                                    onMouseLeave={() => setActiveTooltip(null)}
                                    className={`absolute z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-ice-hi/95 backdrop-blur-xl border border-ink/70 hover:border-arc hover:bg-ink hover:text-ice-hi text-ink flex items-center justify-center transition-colors duration-200 group cursor-pointer ${
                                        isNear ? 'pointer-events-auto shadow-[0_14px_30px_-14px_rgba(13,17,23,0.55)]' : 'pointer-events-none'
                                    }`}
                                    title={`${item.name}: ${item.label}`}
                                    aria-label={`${item.name} channel`}
                                >
                                    <item.icon size={21} strokeWidth={1.75} />

                                    {/* Tooltip */}
                                    <div className={`absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-md bg-ink text-[11px] font-mono text-ice-hi transition-opacity duration-200 pointer-events-none z-40 ${
                                        activeTooltip === item.id ? 'opacity-100' : 'opacity-0'
                                    }`}>
                                        <span className="text-arc-soft mr-1">{item.name}:</span>
                                        {item.label}
                                    </div>
                                </motion.a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
