import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageCircle } from 'lucide-react';
import ResumeDropdown from './ResumeDropdown';
import { useRoute } from '../context/RouteContext';

const navLinks = [
    { name: 'Index', id: 'hero', href: '#hero' },
    { name: 'About', id: 'about', href: '#about' },
    { name: 'Internship', id: 'experience', href: '#experience' },
    { name: 'Creds', id: 'achievements', href: '#achievements' },
    { name: 'Work', id: 'work', href: '#work' },
    { name: 'Contact', id: 'contact', href: '#contact' },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [active, setActive] = useState('hero');
    const { currentPage, setCurrentPage } = useRoute();

    // Lock body scroll while the full-screen menu is open, or the page scrolls
    // behind the overlay.
    useEffect(() => {
        if (!isOpen) return undefined;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);

    // Scroll state + which section is under the upper third of the viewport,
    // so the segmented nav always shows where you are.
    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 40);
            if (currentPage !== 'home') return;
            const probe = window.innerHeight * 0.35;
            let current = 'hero';
            for (const link of navLinks) {
                const el = document.getElementById(link.id);
                if (el && el.getBoundingClientRect().top <= probe) current = link.id;
            }
            setActive(current);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [currentPage]);

    const goHome = () => {
        setCurrentPage('home');
        window.scrollTo(0, 0);
    };

    const toggleAgent = () => {
        setCurrentPage(currentPage === 'agent' ? 'home' : 'agent');
        window.scrollTo(0, 0);
        setIsOpen(false);
    };

    const onAgent = currentPage === 'agent';

    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 lg:px-10 pt-3 md:pt-5 pointer-events-none">
            <nav className="pointer-events-auto mx-auto flex items-center justify-between gap-4">
                {/* Brand */}
                <button
                    onClick={goHome}
                    className={`flex items-center gap-3 rounded-lg pr-3 transition-colors ${scrolled ? 'bg-ice-panel/80 backdrop-blur-md' : ''}`}
                    aria-label="Hetav Shah — home"
                >
                    <span className="w-9 h-9 border-[1.5px] border-ink rounded-[3px] grid place-items-center font-mono text-xs font-medium text-ink bg-ice-hi/60">
                        HS
                    </span>
                    <span className="label text-left leading-[1.55] hidden sm:block">
                        <span className="block text-ink">Hetav Shah</span>
                        <span className="block text-ink-mute">Unit 145 — Portfolio</span>
                    </span>
                </button>

                {/* Desktop segmented nav */}
                <div
                    className={`hidden lg:flex items-center gap-1 p-1.5 rounded-xl border border-ink/20 backdrop-blur-md transition-all duration-300 ${
                        scrolled ? 'bg-ice-hi/90 shadow-[0_12px_30px_-18px_rgba(13,17,23,0.45)]' : 'bg-ice-panel/70'
                    }`}
                >
                    {navLinks.map((link) => {
                        const isActive = !onAgent && active === link.id;
                        return (
                            <a
                                key={link.name}
                                href={link.href}
                                onClick={() => { if (onAgent) setCurrentPage('home'); }}
                                className={`label px-3.5 py-2.5 rounded-md transition-colors ${
                                    isActive ? 'bg-ink text-ice-hi' : 'text-ink hover:bg-ink/[0.06]'
                                }`}
                            >
                                {link.name}
                            </a>
                        );
                    })}
                    <button
                        onClick={toggleAgent}
                        className={`label px-3.5 py-2.5 rounded-md flex items-center gap-2 transition-colors ${
                            onAgent ? 'bg-arc text-white' : 'text-arc-deep hover:bg-arc/10'
                        }`}
                    >
                        <MessageCircle size={13} strokeWidth={2} />
                        {onAgent ? 'Back home' : 'Ask Hetav'}
                    </button>
                </div>

                {/* Right: resume + mobile controls */}
                <div className="flex items-center gap-2">
                    <div className="hidden lg:block">
                        <ResumeDropdown variant="nav" />
                    </div>
                    <button
                        onClick={toggleAgent}
                        className={`lg:hidden h-10 px-3 rounded-lg border flex items-center gap-2 label transition-colors ${
                            onAgent ? 'bg-arc border-arc text-white' : 'border-ink/25 bg-ice-panel/80 backdrop-blur-md text-arc-deep'
                        }`}
                        aria-label="Ask Hetav"
                    >
                        <MessageCircle size={15} />
                        <span className="hidden sm:inline">{onAgent ? 'Home' : 'Ask Hetav'}</span>
                    </button>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="lg:hidden h-10 w-10 grid place-items-center rounded-lg border border-ink/25 bg-ice-panel/80 backdrop-blur-md text-ink"
                        aria-label={isOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={isOpen}
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        data-lenis-prevent
                        // Scrolls on short phones instead of pushing items off-screen.
                        className="fixed inset-0 bg-ice/95 backdrop-blur-lg flex flex-col z-40 lg:hidden pointer-events-auto px-8 pt-20 pb-10 overflow-y-auto"
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-3 right-3 sm:right-6 h-10 w-10 grid place-items-center rounded-lg border border-ink/25 text-ink"
                            aria-label="Close menu"
                        >
                            <X size={20} />
                        </button>
                        <div className="my-auto">
                        <ul className="border-t-[1.5px] border-ink">
                            {navLinks.map((link, index) => (
                                <li key={link.name} className="border-b border-ink/15">
                                    <a
                                        href={link.href}
                                        onClick={() => { setCurrentPage('home'); setIsOpen(false); }}
                                        className="flex items-baseline justify-between py-4"
                                    >
                                        <span className="text-4xl font-semibold tracking-display text-ink">{link.name}</span>
                                        <span className="label text-ink-mute">0{index}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <div className="pt-8">
                            <ResumeDropdown variant="cta" onNavigate={() => setIsOpen(false)} />
                        </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Navbar;
