import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Github, Linkedin, Instagram, Youtube, Sparkles } from 'lucide-react';

const contactChannels = [
    {
        id: 'mail',
        name: 'Email',
        label: 'hetavs145@gmail.com',
        href: "mailto:hetavs145@gmail.com?subject=Let's%20Connect&body=Hi%20Hetav,%0D%0A%0D%0AI%20would%20like%20to%20connect%20with%20you.",
        icon: Mail,
        angle: -145, // Upper Left
        color: 'from-sky-500/20 to-teal-500/30 text-teal-300',
        glow: 'rgba(56, 189, 248, 0.45)',
    },
    {
        id: 'github',
        name: 'GitHub',
        label: 'github.com/Hetavs145',
        href: 'https://github.com/Hetavs145',
        icon: Github,
        angle: -180, // Middle Left
        color: 'from-slate-700/40 to-slate-900/60 text-slate-200',
        glow: 'rgba(255, 255, 255, 0.35)',
    },
    {
        id: 'instagram',
        name: 'Instagram',
        label: '@hetav.shah145',
        href: 'https://www.instagram.com/hetav.shah145/',
        icon: Instagram,
        angle: -215, // Lower Left
        color: 'from-rose-500/30 to-purple-600/30 text-rose-300',
        glow: 'rgba(244, 63, 94, 0.45)',
    },
    {
        id: 'phone',
        name: 'Call',
        label: '+91 8200135258',
        href: 'tel:+918200135258',
        icon: Phone,
        angle: -35, // Upper Right
        color: 'from-emerald-500/30 to-teal-500/30 text-emerald-300',
        glow: 'rgba(16, 185, 129, 0.45)',
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        label: 'linkedin.com/in/hetav-shah',
        href: 'https://www.linkedin.com/in/hetav-shah-26601722b/',
        icon: Linkedin,
        angle: 0, // Middle Right
        color: 'from-blue-600/30 to-cyan-500/30 text-blue-300',
        glow: 'rgba(59, 130, 246, 0.45)',
    },
    {
        id: 'youtube',
        name: 'YouTube',
        label: '@NeuroStucks',
        href: 'https://www.youtube.com/@NeuroStucks',
        icon: Youtube,
        angle: 35, // Lower Right
        color: 'from-red-600/30 to-rose-500/30 text-red-400',
        glow: 'rgba(239, 68, 68, 0.45)',
    }
];

const Contact = () => {
    const [isNear, setIsNear] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState(null);
    const hubRef = useRef(null);

    useEffect(() => {
        const mq = window.matchMedia('(pointer: coarse)');
        const updateTouch = () => {
            setIsTouch(mq.matches || 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
        };
        updateTouch();
        mq.addEventListener('change', updateTouch);

        // Listen for touch event dispatched from Background3D when robot is tapped on mobile
        const handleRoboTouch = () => {
            setIsNear(prev => !prev);
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
        <section id="contact" className="py-20 mb-20 relative z-10">
            <div className="container mx-auto px-6 md:px-12 lg:px-24 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    <span className="text-teal-400 font-mono text-lg block mb-4">What's Next?</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-lighter mb-4">Get In Touch</h2>
                    <p className="text-slate text-base md:text-lg max-w-xl mx-auto mb-10">
                        I’m currently looking for new opportunities, my inbox is always open. Whether you have a question or just want to say hi, I’ll try my best to get back to you!
                    </p>

                    {/* Interactive Robot Orbital Hub Zone */}
                    <div
                        ref={hubRef}
                        className="relative w-full max-w-lg h-80 sm:h-96 mx-auto flex items-center justify-center select-none cursor-pointer"
                        onMouseEnter={() => !isTouch && setIsNear(true)}
                        onMouseLeave={() => !isTouch && setIsNear(false)}
                        onClick={() => isTouch && setIsNear(prev => !prev)}
                    >
                        {/* Center Holographic Status Prompt */}
                        <div
                            className={`flex flex-col items-center gap-2.5 transition-all duration-500 ${
                                isNear ? 'opacity-30 scale-90' : 'opacity-90 scale-100'
                            }`}
                        >
                            <div className="w-12 h-12 rounded-full border border-teal-400/40 bg-navy-900/80 backdrop-blur-md flex items-center justify-center text-teal-400 shadow-[0_0_16px_rgba(56,189,248,0.25)] animate-pulse">
                                <Sparkles size={22} className="text-teal-300" />
                            </div>
                            <span className="font-mono text-xs text-teal-400/85 tracking-widest uppercase bg-navy-950/80 px-3 py-1 rounded-full border border-teal-400/20 backdrop-blur-sm">
                                {isTouch
                                    ? (isNear ? 'Tap robo to hide' : 'Tap on robo to connect')
                                    : (isNear ? 'Move cursor away to hide' : 'Move cursor near robo body to connect')}
                            </span>
                        </div>

                        {/* Floating Orbital Channels Blooming Around Robot Body */}
                        {contactChannels.map((item, index) => {
                            const coords = getCoordinates(item.angle);
                            const floatOffset = (index % 2 === 0 ? 1 : -1) * 6;

                            return (
                                <motion.a
                                    key={item.id}
                                    href={item.href}
                                    target={item.href.startsWith('mailto:') || item.href.startsWith('tel:') ? '_self' : '_blank'}
                                    rel="noopener noreferrer"
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
                                    whileHover={{ scale: 1.25 }}
                                    whileTap={{ scale: 0.92 }}
                                    onMouseEnter={() => setActiveTooltip(item.id)}
                                    onMouseLeave={() => setActiveTooltip(null)}
                                    className={`absolute z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${item.color} bg-navy-900/95 backdrop-blur-xl border border-teal-400/50 hover:border-teal-200 flex items-center justify-center shadow-2xl shadow-black/70 transition-all duration-300 group cursor-pointer ${
                                        isNear ? 'pointer-events-auto' : 'pointer-events-none'
                                    }`}
                                    style={{
                                        boxShadow: isNear ? `0 0 20px ${item.glow}` : 'none'
                                    }}
                                    title={`${item.name}: ${item.label}`}
                                    aria-label={`${item.name} channel`}
                                >
                                    <item.icon size={22} className="transition-transform group-hover:scale-115" />

                                    {/* Holographic Tooltip Badge on Hover */}
                                    <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-md bg-navy-950/95 border border-teal-400/40 text-[11px] font-mono text-teal-300 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-xl shadow-black/80 z-40">
                                        <span className="font-bold text-teal-400 mr-1">{item.name}:</span>
                                        <span className="text-slate-200">{item.label}</span>
                                    </div>
                                </motion.a>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Contact;
