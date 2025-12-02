import React from 'react';
import { Github, Linkedin, Mail, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-navy-800 py-8 text-center text-slate-light font-mono text-sm border-t border-navy-700">
            <div className="flex justify-center space-x-6 mb-4">
                <a href="https://github.com/hetavshah" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 hover:-translate-y-1 transition-all">
                    <Github size={20} />
                </a>
                <a href="https://linkedin.com/in/hetav-shah-26601722b" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 hover:-translate-y-1 transition-all">
                    <Linkedin size={20} />
                </a>
                <a href="https://www.instagram.com/hetav.shah145/" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 hover:-translate-y-1 transition-all">
                    <Instagram size={20} />
                </a>
                <a href="mailto:hetavs145@gmail.com" className="hover:text-teal-400 hover:-translate-y-1 transition-all">
                    <Mail size={20} />
                </a>
            </div>
            <p className="hover:text-teal-400 transition-colors cursor-default mb-2">
                Designed & Built by Hetav Shah
            </p>
            <p className="text-xs text-slate-500">
                &copy; 2025 Hetav Shah. All rights reserved.
            </p>
        </footer>
    );
};

export default Footer;
