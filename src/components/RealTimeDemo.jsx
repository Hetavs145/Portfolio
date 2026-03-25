import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2 } from 'lucide-react';

const RealTimeDemo = () => {
    const [messages, setMessages] = useState([
        { id: 1, text: "hey! i'm hetav's portfolio agent. ask me anything about him — skills, projects, experience, whatever.", sender: 'bot' },
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
            const response = await fetch('/api/chat', {
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
        <section id="demo" className="py-20 bg-navy-800/50">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="flex items-center mb-12">
                    <span className="text-teal-400 font-mono text-xl mr-4">04.</span>
                    <h2 className="text-3xl font-bold text-slate-lighter">Talk to My Agent</h2>
                    <div className="h-px bg-navy-600 flex-grow ml-4"></div>
                </div>

                <div className="max-w-md mx-auto">
                    <div className="bg-navy-700 rounded-lg overflow-hidden shadow-xl border border-navy-600">
                        {/* Chat Header */}
                        <div className="bg-navy-900 p-4 flex justify-between items-center border-b border-navy-600">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse"></div>
                                <h3 className="text-slate-lighter font-bold">Hetav's Agent</h3>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-slate-light font-mono">
                                <Bot size={14} className="text-teal-400" />
                                <span>RAG Agent</span>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div ref={chatContainerRef} className="h-80 overflow-y-auto p-4 space-y-4 bg-navy-800">
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
                        <form onSubmit={handleSend} className="p-4 bg-navy-900 border-t border-navy-600 flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about Hetav..."
                                disabled={isTyping}
                                className="flex-1 bg-navy-800 text-slate-lighter px-4 py-2 rounded focus:outline-none focus:ring-1 focus:ring-teal-400 disabled:opacity-50"
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
