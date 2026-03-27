import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2 } from 'lucide-react';

const RealTimeDemo = () => {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hey! I'm Hetav, Ask me anything about my portfolio - skills, projects, experience, whatever.", sender: 'bot' },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatContainerRef = useRef(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userText = input.trim();
        const newMessage = { id: Date.now(), text: userText, sender: 'user' };
        setMessages(prev => [...prev, newMessage]);
        setInput('');
        setIsTyping(true);

        // Build conversation history for memory
        const conversationHistory = [...messages, newMessage]
            .filter(m => m.id !== 1) // skip initial greeting
            .map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text,
            }));

        try {
            const apiBase = import.meta.env.VITE_AGENT_API_URL || '';
            const response = await fetch(`${apiBase}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: conversationHistory }),
            });

            if (!response.ok) throw new Error('API error');

            const data = await response.json();
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: data.message,
                sender: 'bot',
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "hmm, seems like the agent isn't connected right now. try again later!",
                sender: 'bot',
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <section id="demo" className="min-h-screen pt-24 md:pt-32 pb-10 md:pb-20 bg-navy-800/50 flex items-start justify-center">
            <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
                <div className="flex items-center mb-8 md:mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-lighter">Talk to My Agent</h2>
                    <div className="h-px bg-navy-600 flex-grow ml-4"></div>
                </div>

                <div className="max-w-lg mx-auto">
                    <div className="bg-navy-700 rounded-lg overflow-hidden shadow-xl border border-navy-600">
                        {/* Chat Header */}
                        <div className="bg-navy-900 p-3 md:p-4 flex justify-between items-center border-b border-navy-600">
                            <div className="flex items-center space-x-2 md:space-x-3">
                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-teal-400 animate-pulse"></div>
                                <h3 className="text-slate-lighter font-bold text-sm md:text-base">Hetav's Agent</h3>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-slate-light font-mono">
                                <Bot size={14} className="text-teal-400" />
                                <span className="hidden sm:inline">RAG Agent</span>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div ref={chatContainerRef} className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-18rem)] md:h-[28rem] overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-navy-800">
                            <AnimatePresence>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.sender === 'user'
                                                ? 'bg-teal-400 text-navy-900 rounded-br-none'
                                                : 'bg-navy-600 text-slate-lighter rounded-bl-none'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Typing indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-navy-600 text-slate-lighter rounded-lg rounded-bl-none p-3 flex items-center space-x-1">
                                        <motion.span
                                            className="w-2 h-2 bg-teal-400 rounded-full"
                                            animate={{ y: [0, -6, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                        />
                                        <motion.span
                                            className="w-2 h-2 bg-teal-400 rounded-full"
                                            animate={{ y: [0, -6, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                                        />
                                        <motion.span
                                            className="w-2 h-2 bg-teal-400 rounded-full"
                                            animate={{ y: [0, -6, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSend} className="p-3 md:p-4 bg-navy-900 border-t border-navy-600 flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about Hetav..."
                                disabled={isTyping}
                                className="flex-1 bg-navy-800 text-slate-lighter px-3 md:px-4 py-2 rounded text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-teal-400 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isTyping}
                                className="bg-teal-400 text-navy-900 p-2 rounded hover:bg-teal-300 transition-colors disabled:opacity-50"
                            >
                                {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </form>
                    </div>

                    {/* Agent description */}
                    <p className="text-center text-slate-500 text-xs font-mono mt-4">
                        A LangGraph-based intelligent RAG human-like replier agent
                    </p>
                </div>
            </div>
        </section>
    );
};

export default RealTimeDemo;
