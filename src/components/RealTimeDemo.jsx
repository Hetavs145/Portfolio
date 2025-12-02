import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Wifi } from 'lucide-react';

const RealTimeDemo = () => {
    const [messages, setMessages] = useState([
        { id: 1, text: 'Hello! Welcome to the real-time demo.', sender: 'bot' },
    ]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMessage = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, newMessage]);
        setInput('');

        // Simulate bot response
        setTimeout(() => {
            const botResponses = [
                "That's interesting!",
                "Tell me more.",
                "I'm a simulated real-time bot.",
                "Hetchat uses Socket.IO for real-time comms.",
                "This is just a demo, but the real app is cooler!"
            ];
            const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
            setMessages(prev => [...prev, { id: Date.now() + 1, text: randomResponse, sender: 'bot' }]);
        }, 1000);
    };

    return (
        <section id="demo" className="py-20 bg-navy-800/50">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="flex items-center mb-12">
                    <span className="text-teal-400 font-mono text-xl mr-4">03.</span>
                    <h2 className="text-3xl font-bold text-slate-lighter">Real-Time Demo</h2>
                    <div className="h-px bg-navy-600 flex-grow ml-4"></div>
                </div>

                <div className="max-w-md mx-auto bg-navy-700 rounded-lg overflow-hidden shadow-xl border border-navy-600">
                    {/* Chat Header */}
                    <div className="bg-navy-900 p-4 flex justify-between items-center border-b border-navy-600">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse"></div>
                            <h3 className="text-slate-lighter font-bold">Hetchat Demo</h3>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-light">
                            <Wifi size={14} className={isConnected ? "text-teal-400" : "text-red-500"} />
                            <span>{isConnected ? "Connected" : "Disconnected"}</span>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="h-80 overflow-y-auto p-4 space-y-4 bg-navy-800">
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
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSend} className="p-4 bg-navy-900 border-t border-navy-600 flex space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-navy-800 text-slate-lighter px-4 py-2 rounded focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                        <button
                            type="submit"
                            className="bg-teal-400 text-navy-900 p-2 rounded hover:bg-teal-300 transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default RealTimeDemo;
