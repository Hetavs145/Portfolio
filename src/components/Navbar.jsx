import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Github, Linkedin, Mail, MessageCircle } from 'lucide-react';
import ResumeDropdown from './ResumeDropdown';
import { useRoute } from '../context/RouteContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

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
    const [scrolled, setScrolled] = useState(false);
    const { currentPage, setCurrentPage } = useRoute();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'About', href: '#about' },
        { name: 'Experience', href: '#experience' },
        { name: 'Credentials', href: '#achievements' },
        { name: 'Work', href: '#work' },
        { name: 'Contact', href: '#contact' },
    ];

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass py-3 md:py-4' : 'bg-transparent py-4 md:py-6'}`}>
            <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
                <motion.button
                    onClick={() => { setCurrentPage('home'); window.scrollTo(0, 0); }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-teal-400 font-mono text-lg md:text-xl font-bold"
                >
                    Hetav
                </motion.button>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                    <ol className="flex space-x-8">
                        <motion.li
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0 }}
                        >
                            <button
                                onClick={() => { setCurrentPage('home'); window.scrollTo(0, 0); }}
                                className="text-slate-light hover:text-teal-400 font-mono text-sm transition-colors"
                            >
                                Home
                            </button>
                        </motion.li>
                        {navLinks.map((link, index) => (
                            <motion.li
                                key={link.name}
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: (index + 1) * 0.1 }}
                            >
                                <a
                                    href={link.href}
                                    onClick={() => { if (currentPage !== 'home') { setCurrentPage('home'); } }}
                                    className="text-slate-light hover:text-teal-400 font-mono text-sm transition-colors"
                                >
                                    {link.name}
                                </a>
                            </motion.li>
                        ))}
                    </ol>
                    <motion.button
                        onClick={() => {
                            setCurrentPage(currentPage === 'agent' ? 'home' : 'agent');
                            window.scrollTo(0, 0);
                        }}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className={`px-4 py-2 rounded font-mono text-sm transition-all duration-300 flex items-center gap-2 ${
                            currentPage === 'agent'
                                ? 'bg-teal-400 text-navy-900 shadow-lg shadow-teal-400/25'
                                : 'border border-teal-400 text-teal-400 hover:bg-teal-400/10'
                        }`}
                    >
                        <MessageCircle size={14} />
                        {currentPage === 'agent' ? 'Back Home' : 'Ask Hetav'}
                    </motion.button>
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <ResumeDropdown variant="nav" />
                    </motion.div>
                </div>

                {/* Mobile: Ask Hetav icon + Hamburger */}
                <div className="flex md:hidden items-center gap-3">
                    <motion.button
                        onClick={() => {
                            setCurrentPage(currentPage === 'agent' ? 'home' : 'agent');
                            window.scrollTo(0, 0);
                            setIsOpen(false);
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                            currentPage === 'agent'
                                ? 'bg-teal-400 text-navy-900 shadow-lg shadow-teal-400/25'
                                : 'border border-teal-400 text-teal-400'
                        }`}
                        aria-label="Ask Hetav"
                    >
                        <MessageCircle size={20} />
                    </motion.button>
                    <button onClick={() => setIsOpen(!isOpen)} className="text-teal-400">
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="fixed inset-0 bg-navy-900/95 backdrop-blur-lg flex flex-col items-center justify-center z-40 md:hidden"
                >
                    <ul className="space-y-6 text-center w-full px-8">
                        <li>
                            <button
                                onClick={() => { setCurrentPage('home'); window.scrollTo(0, 0); setIsOpen(false); }}
                                className="text-slate-light hover:text-teal-400 font-mono text-lg block w-full"
                            >
                                <span className="text-teal-400 block text-xs mb-1 font-mono">00.</span>
                                Home
                            </button>
                        </li>
                        {navLinks.map((link, index) => (
                            <li key={link.name}>
                                <a
                                    href={link.href}
                                    onClick={() => { setCurrentPage('home'); setIsOpen(false); }}
                                    className="text-slate-light hover:text-teal-400 font-mono text-lg block"
                                >
                                    <span className="text-teal-400 block text-xs mb-1 font-mono">0{index + 1}.</span>
                                    {link.name}
                                </a>
                            </li>
                        ))}
                        <li className="pt-4">
                            <ResumeDropdown variant="nav" onNavigate={() => setIsOpen(false)} />
                        </li>
                    </ul>
                </motion.div>
            )}
        </nav>
    );
};

export default Navbar;
