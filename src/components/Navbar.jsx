import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Github, Linkedin, Mail } from 'lucide-react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

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
        { name: 'Work', href: '#work' },
        { name: 'Contact', href: '#contact' },
    ];

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass py-4' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <motion.a
                    href="#"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-teal-400 font-mono text-xl font-bold"
                >
                    Hetav
                </motion.a>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                    <ol className="flex space-x-8">
                        <motion.li
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0 }}
                        >
                            <a
                                href="#hero"
                                className="text-slate-light hover:text-teal-400 font-mono text-sm transition-colors"
                            >
                                Home
                            </a>
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
                                    className="text-slate-light hover:text-teal-400 font-mono text-sm transition-colors"
                                >
                                    {link.name}
                                </a>
                            </motion.li>
                        ))}
                    </ol>
                    <motion.a
                        href="/resume.pdf"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
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
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-light hover:text-teal-400 font-mono text-xl block"
                                >
                                    <span className="text-teal-400 block text-sm mb-2">0{index + 1}.</span>
                                    {link.name}
                                </a>
                            </li>
                        ))}
                        <li>
                            <a
                                href="/resume.pdf"
                                className="inline-block border border-teal-400 text-teal-400 px-8 py-3 rounded mt-4 hover:bg-teal-400/10"
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
