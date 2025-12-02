import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Github, Linkedin, Instagram } from 'lucide-react';
import MagneticButton from './MagneticButton';

const Contact = () => {
    return (
        <section id="contact" className="py-20 mb-20">
            <div className="container mx-auto px-6 md:px-12 lg:px-24 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    <span className="text-teal-400 font-mono text-lg block mb-4">What's Next?</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-lighter mb-6">Get In Touch</h2>
                    <p className="text-slate text-lg max-w-xl mx-auto mb-12">
                        I’m currently looking for new opportunities, my inbox is always open. Whether you have a question or just want to say hi, I’ll try my best to get back to you!
                    </p>

                    <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-12">
                        <MagneticButton
                            href="mailto:hetavs145@gmail.com"
                            className="flex items-center space-x-2 border border-teal-400 text-teal-400 px-8 py-4 rounded hover:bg-teal-400/10 transition-colors font-mono inline-block"
                        >
                            <Mail size={20} />
                            <span>Say Hello</span>
                        </MagneticButton>
                        <MagneticButton
                            href="tel:+918200135258"
                            className="flex items-center space-x-2 border border-slate-light text-slate-light px-8 py-4 rounded hover:bg-slate-light/10 transition-colors font-mono inline-block"
                        >
                            <Phone size={20} />
                            <span>+91 8200135258</span>
                        </MagneticButton>
                    </div>

                    <div className="flex justify-center space-x-8">
                        <a
                            href="https://github.com/hetavshah"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-light hover:text-teal-400 hover:-translate-y-1 transition-all"
                        >
                            <Github size={30} />
                        </a>
                        <a
                            href="https://linkedin.com/in/hetav-shah-26601722b"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-light hover:text-teal-400 hover:-translate-y-1 transition-all"
                        >
                            <Linkedin size={30} />
                        </a>
                        <a
                            href="https://www.instagram.com/hetav.shah145/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-light hover:text-teal-400 hover:-translate-y-1 transition-all"
                        >
                            <Instagram size={30} />
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Contact;
