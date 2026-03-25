import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Github, Linkedin, Mail, MessageCircle } from 'lucide-react';
import { useRoute } from '../context/RouteContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
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
        { name: 'Achievements', href: '#achievements' },
        { name: 'Work', href: '#work' },
        { name: 'Contact', href: '#contact' },
    ];

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass py-4' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <motion.button
                    onClick={() => { setCurrentPage('home'); window.scrollTo(0, 0); }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-teal-400 font-mono text-xl font-bold"
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
                    <motion.a
                        href="/Hetav_Shah_Resume.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="border border-teal-400 text-teal-400 px-4 py-2 rounded hover:bg-teal-400/10 transition-colors font-mono text-sm"
                    >
                        Resume
                    </motion.a>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} className="text-teal-400">
                        {isOpen ? <X size={30} /> : <Menu size={30} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="fixed inset-0 bg-navy-900/95 backdrop-blur-lg flex flex-col items-center justify-center z-40 md:hidden"
                >
                    <ul className="space-y-8 text-center">
                        {navLinks.map((link, index) => (
                            <li key={link.name}>
                                <a
                                    href={link.href}
                                    onClick={() => { setCurrentPage('home'); setIsOpen(false); }}
                                    className="text-slate-light hover:text-teal-400 font-mono text-xl block"
                                >
                                    <span className="text-teal-400 block text-sm mb-2">0{index + 1}.</span>
                                    {link.name}
                                </a>
                            </li>
                        ))}
                        <li>
                            <button
                                onClick={() => {
                                    setCurrentPage(currentPage === 'agent' ? 'home' : 'agent');
                                    window.scrollTo(0, 0);
                                    setIsOpen(false);
                                }}
                                className={`px-6 py-3 rounded font-mono inline-flex items-center gap-2 transition-all duration-300 ${
                                    currentPage === 'agent'
                                        ? 'bg-teal-400 text-navy-900 shadow-lg shadow-teal-400/25'
                                        : 'border border-teal-400 text-teal-400 hover:bg-teal-400/10'
                                }`}
                            >
                                <MessageCircle size={16} />
                                {currentPage === 'agent' ? 'Back Home' : 'Ask Hetav'}
                            </button>
                        </li>
                        <li>
                            <a
                                href="/Hetav_Shah_Resume.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border border-teal-400 text-teal-400 px-6 py-3 rounded hover:bg-teal-400/10 transition-colors font-mono inline-block"
                                onClick={() => setIsOpen(false)}
                            >
                                Resume
                            </a>
                        </li>
                    </ul>
                </motion.div>
            )}
        </nav>
    );
};

export default Navbar;
