import React, { useState, useEffect, useRef } from 'react';
import { Github, Linkedin, Mail, Instagram, Youtube, Rocket } from 'lucide-react';
import { useRoute } from '../context/RouteContext';

const socials = [
    { href: 'https://github.com/Hetavs145', icon: Github, label: 'GitHub' },
    { href: 'https://www.linkedin.com/in/hetav-shah-26601722b/', icon: Linkedin, label: 'LinkedIn' },
    { href: 'https://www.instagram.com/hetav.shah145/', icon: Instagram, label: 'Instagram' },
    { href: 'https://www.youtube.com/@NeuroStucks', icon: Youtube, label: 'YouTube' },
    { href: 'mailto:hetavs145@gmail.com', icon: Mail, label: 'Email' },
];

const Footer = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);
    // How far the footer has risen into the viewport. The fixed rocket button
    // is lifted by this much so it docks above the footer instead of sitting
    // on top of the footer's text.
    const [footerOverlap, setFooterOverlap] = useState(0);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const footerRef = useRef(null);
    const { currentPage } = useRoute();

    useEffect(() => {
        const onScroll = () => {
            setShowScrollTop(window.scrollY > 300);
            const top = footerRef.current?.getBoundingClientRect().top ?? Infinity;
            setFooterOverlap(Math.max(0, Math.round(window.innerHeight - top)));
        };
        onScroll();
        window.addEventListener('resize', onScroll);
        window.addEventListener('scroll', onScroll, { passive: true });

        const mq = window.matchMedia('(pointer: coarse)');
        const checkTouch = () => {
            setIsTouchDevice(mq.matches || 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
        };
        checkTouch();
        mq.addEventListener('change', checkTouch);

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            mq.removeEventListener('change', checkTouch);
        };
    }, []);

    const handleScrollToTop = () => {
        // Dispatch cinematic flight takeoff event to Background3D
        window.dispatchEvent(new CustomEvent('flight-takeoff'));
        // Smoothly scroll browser to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer ref={footerRef} className="relative z-10 border-t-[1.5px] border-ink bg-ice-panel/85 backdrop-blur-md text-ink">
            {/* "Move cursor near the arc reactor" hint */}
            {currentPage !== 'agent' && (
                <div className="py-3 px-4 border-b border-ink/15 flex items-center justify-center gap-2.5 label text-arc-deep">
                    <span className="w-1.5 h-1.5 rounded-full bg-arc animate-pulse" aria-hidden="true" />
                    {isTouchDevice ? 'tap on arc reactor to see the magic' : 'move cursor near arc reactor to see the magic'}
                </div>
            )}

            <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-[60px] py-7 grid gap-5 md:grid-cols-[1fr_auto_1fr] items-center">
                <p className="label text-ink-mute text-center md:text-left">
                    &copy; 2024–2026 Hetav Shah. All rights reserved.
                </p>
                <div className="flex justify-center gap-2">
                    {socials.map(({ href, icon: Icon, label }) => (
                        <a
                            key={label}
                            href={href}
                            target={href.startsWith('mailto:') ? '_self' : '_blank'}
                            rel="noopener noreferrer"
                            aria-label={label}
                            className="w-10 h-10 rounded-lg border border-ink/20 grid place-items-center text-ink hover:bg-ink hover:text-ice-hi hover:-translate-y-0.5 transition-all"
                        >
                            <Icon size={17} strokeWidth={1.75} />
                        </a>
                    ))}
                </div>
                <p className="label text-ink text-center md:text-right">Designed &amp; built by Hetav Shah</p>
            </div>

            {/* Scroll-to-top rocket: also launches the robot's flight animation */}
            {showScrollTop && (
                <button
                    onClick={handleScrollToTop}
                    style={footerOverlap > 0 ? { transform: `translateY(-${footerOverlap}px)` } : undefined}
                    className="fixed bottom-6 right-5 md:bottom-8 md:right-8 z-40 flex items-center gap-2 h-11 px-3.5 rounded-lg bg-ink text-ice-hi border border-ink shadow-[0_14px_30px_-12px_rgba(13,17,23,0.6)] hover:bg-arc hover:border-arc transition-colors duration-300 group"
                    title="Rocket to Top"
                    aria-label="Scroll to top with robot flight animation"
                >
                    <Rocket size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                    <span className="label hidden sm:inline">Top</span>
                </button>
            )}
        </footer>
    );
};

export default Footer;
