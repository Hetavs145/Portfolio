import React, { useState, useEffect } from 'react';
import { Github, Linkedin, Mail, Instagram, Youtube, Rocket } from 'lucide-react';
import { useRoute } from '../context/RouteContext';

const Footer = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);

    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const { currentPage } = useRoute();

    useEffect(() => {
        const onScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', onScroll, { passive: true });

        const mq = window.matchMedia('(pointer: coarse)');
        const checkTouch = () => {
            setIsTouchDevice(mq.matches || 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
        };
        checkTouch();
        mq.addEventListener('change', checkTouch);

        return () => {
            window.removeEventListener('scroll', onScroll);
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
        <footer className="relative z-10 bg-navy-950/90 backdrop-blur-md text-center text-slate-light font-mono text-sm border-t border-white/5 shadow-2xl">
            {/* "Move cursor near to robo to see the magic" / "Tap on robo to see the magic" responsive banner */}
            {currentPage !== 'agent' && (
                <div className="py-3 px-4 border-b border-white/5 bg-navy-900/40 backdrop-blur-sm flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
                    <span className="tracking-wider text-teal-400/90 font-medium">
                        {isTouchDevice ? 'tap on arc reactor to see the magic' : 'move cursor near arc reactor to see the magic'}
                    </span>
                </div>
            )}

            <div className="py-8">
                <div className="flex justify-center space-x-6 mb-4">
                    <a href="https://github.com/Hetavs145" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 hover:-translate-y-1 transition-all">
                        <Github size={20} />
                    </a>
                    <a href="https://www.linkedin.com/in/hetav-shah-26601722b/" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 hover:-translate-y-1 transition-all">
                        <Linkedin size={20} />
                    </a>
                    <a href="https://www.instagram.com/hetav.shah145/" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 hover:-translate-y-1 transition-all">
                        <Instagram size={20} />
                    </a>
                    <a href="https://www.youtube.com/@NeuroStucks" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 hover:-translate-y-1 transition-all">
                        <Youtube size={20} />
                    </a>
                    <a href="mailto:hetavs145@gmail.com" className="hover:text-teal-400 hover:-translate-y-1 transition-all">
                        <Mail size={20} />
                    </a>
                </div>
                <p className="hover:text-teal-400 transition-colors cursor-default mb-2">
                    Designed & Built by Hetav Shah
                </p>
                <p className="text-xs text-slate-500">
                    &copy; 2024–2026 Hetav Shah. All rights reserved.
                </p>
            </div>

            {/* Scroll to Top Rocket Button (Right side, elevated above footer) */}
            {showScrollTop && (
                <button
                    onClick={handleScrollToTop}
                    className="fixed bottom-8 right-6 md:right-8 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-navy-900/90 backdrop-blur-md border border-teal-400/40 text-teal-400 hover:border-teal-300 hover:bg-teal-400/20 hover:text-white shadow-2xl shadow-teal-400/20 transition-all duration-300 group hover:scale-105"
                    title="Rocket to Top"
                    aria-label="Scroll to top with robot flight animation"
                >
                    <Rocket size={18} className="group-hover:-translate-y-1 transition-transform text-teal-300" />
                    <span className="font-mono text-xs hidden sm:inline font-bold">Top</span>
                </button>
            )}
        </footer>
    );
};

export default Footer;
