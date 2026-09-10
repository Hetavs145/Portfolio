import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Bot,
    Loader2,
    RotateCcw,
    History,
    Plus,
    Trash2,
    X,
    Clock,
    MessageSquare,
} from "lucide-react";

const STORAGE_KEY = "hetav_agent_sessions_v1";
const ACTIVE_SESSION_KEY = "hetav_agent_active_session_id";
const RETENTION_DAYS = 30;
const THIRTY_DAYS_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

const DEFAULT_GREETING = {
    id: 1,
    text: "Hey! I'm Hetav, Ask me anything about my portfolio - skills, projects, experience, whatever.",
    sender: "bot",
};

// Filter out sessions older than 30 days
const pruneOldSessions = (sessionList) => {
    const now = Date.now();
    return (sessionList || []).filter((s) => {
        const time = s.updatedAt || s.createdAt || 0;
        return now - time < THIRTY_DAYS_MS;
    });
};

// Load saved sessions from localStorage with 30-day retention
const loadStoredSessions = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        const pruned = pruneOldSessions(parsed);
        if (pruned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        }
        return pruned;
    } catch {
        return [];
    }
};

const createSessionId = () =>
    "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);

const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "";
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
};

const RealTimeDemo = () => {
    const [sessions, setSessions] = useState(() => loadStoredSessions());
    const [sessionId, setSessionId] = useState(() => {
        try {
            const savedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
            const stored = loadStoredSessions();
            if (savedActiveId && stored.some((s) => s.id === savedActiveId)) {
                return savedActiveId;
            }
        } catch {}
        return createSessionId();
    });

    const [messages, setMessages] = useState(() => {
        try {
            const savedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
            const stored = loadStoredSessions();
            const active = stored.find((s) => s.id === savedActiveId);
            if (active && Array.isArray(active.messages) && active.messages.length > 0) {
                return active.messages;
            }
        } catch {}
        return [DEFAULT_GREETING];
    });

    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    };

    useEffect(() => {
        if (!showHistory) {
            scrollToBottom();
        }
    }, [messages, isTyping, showHistory]);

    // Persist a session into history (retained up to 30 days)
    const persistSession = (currentSessionId, updatedMessages) => {
        const userMsgs = updatedMessages.filter((m) => m.sender === "user");
        if (userMsgs.length === 0) return;

        const firstUserText = userMsgs[0].text;
        const title =
            firstUserText.length > 40
                ? firstUserText.slice(0, 40) + "..."
                : firstUserText;

        const now = Date.now();

        setSessions((prev) => {
            const currentPruned = pruneOldSessions(prev);
            const existingIndex = currentPruned.findIndex((s) => s.id === currentSessionId);

            let nextSessions;
            if (existingIndex >= 0) {
                const existing = currentPruned[existingIndex];
                const updated = {
                    ...existing,
                    title: existing.title || title,
                    updatedAt: now,
                    messages: updatedMessages,
                };
                nextSessions = [
                    updated,
                    ...currentPruned.filter((_, idx) => idx !== existingIndex),
                ];
            } else {
                const newSession = {
                    id: currentSessionId,
                    title,
                    createdAt: now,
                    updatedAt: now,
                    messages: updatedMessages,
                };
                nextSessions = [newSession, ...currentPruned];
            }

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
                localStorage.setItem(ACTIVE_SESSION_KEY, currentSessionId);
            } catch (err) {
                console.warn("Failed to persist chat session:", err);
            }

            return nextSessions;
        });
    };

    // Refresh chat: resets current session back to fresh greeting
    const handleRefreshChat = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 450);

        const newId = createSessionId();
        setSessionId(newId);
        setMessages([DEFAULT_GREETING]);
        setInput("");
        setIsTyping(false);
        setShowHistory(false);
        try {
            localStorage.setItem(ACTIVE_SESSION_KEY, newId);
        } catch {}
        inputRef.current?.focus();
    };

    // Rechat from older chat: load chosen session and continue conversation
    const handleSelectSession = (selectedSession) => {
        setSessionId(selectedSession.id);
        setMessages(selectedSession.messages);
        setShowHistory(false);
        setInput("");
        try {
            localStorage.setItem(ACTIVE_SESSION_KEY, selectedSession.id);
        } catch {}
        setTimeout(() => {
            scrollToBottom();
            inputRef.current?.focus();
        }, 80);
    };

    const handleDeleteSession = (e, targetSessionId) => {
        e.stopPropagation();
        setSessions((prev) => {
            const next = prev.filter((s) => s.id !== targetSessionId);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
            return next;
        });

        if (targetSessionId === sessionId) {
            handleRefreshChat();
        }
    };

    const handleClearAllHistory = () => {
        if (window.confirm("Clear all chat history from the last 30 days?")) {
            setSessions([]);
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch {}
            handleRefreshChat();
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userText = input.trim();
        const newMessage = { id: Date.now(), text: userText, sender: "user" };
        const nextMessages = [...messages, newMessage];

        setMessages(nextMessages);
        setInput("");
        setIsTyping(true);
        persistSession(sessionId, nextMessages);

        // Build conversation history for memory (slice last 20 messages for context safety)
        const conversationHistory = nextMessages
            .filter((m) => m.id !== 1)
            .slice(-20)
            .map((m) => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.text,
            }));

        try {
            const apiBase = import.meta.env.VITE_AGENT_API_URL || "";
            const response = await fetch(`${apiBase}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: conversationHistory }),
            });

            if (!response.ok) throw new Error("API error");

            const data = await response.json();
            const botMessage = {
                id: Date.now() + 1,
                text: data.message,
                sender: "bot",
            };
            const finalMessages = [...nextMessages, botMessage];
            setMessages(finalMessages);
            persistSession(sessionId, finalMessages);
        } catch {
            const errorMessage = {
                id: Date.now() + 1,
                text: "hmm, seems like the agent isn't connected right now. try again later!",
                sender: "bot",
            };
            const finalMessages = [...nextMessages, errorMessage];
            setMessages(finalMessages);
            persistSession(sessionId, finalMessages);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <section
            id="demo"
            className="min-h-screen pt-20 sm:pt-24 md:pt-32 pb-8 md:pb-20 bg-navy-800/50 flex items-start justify-center"
        >
            <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
                <div className="flex items-center mb-5 sm:mb-8 md:mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-lighter">
                        Talk to My Agent
                    </h2>
                    <div className="h-px bg-navy-600 flex-grow ml-4"></div>
                </div>

                <div className="max-w-lg mx-auto">
                    <div data-lenis-prevent className="bg-navy-700 rounded-lg overflow-hidden shadow-xl border border-navy-600">
                        {/* Chat Header */}
                        <div className="bg-navy-900 p-3 md:p-4 flex justify-between items-center border-b border-navy-600">
                            <div className="flex items-center space-x-2 md:space-x-3">
                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-teal-400 animate-pulse"></div>
                                <div>
                                    <h3 className="text-slate-lighter font-bold text-sm md:text-base leading-tight">
                                        Hetav's Agent
                                    </h3>
                                    <span className="text-[10px] text-teal-400 font-mono hidden sm:inline-block">
                                        RAG Agent · 30-Day Memory
                                    </span>
                                </div>
                            </div>

                            {/* Header Action Controls */}
                            <div className="flex items-center space-x-1.5 sm:space-x-2">
                                {/* Refresh Chat Button */}
                                <button
                                    type="button"
                                    onClick={handleRefreshChat}
                                    title="Refresh chat (start new conversation)"
                                    className="flex items-center gap-1 text-xs font-mono text-slate-light hover:text-teal-400 hover:bg-navy-800 px-2 sm:px-2.5 py-1.5 rounded transition-all active:scale-95 border border-transparent hover:border-navy-600"
                                    aria-label="Refresh chat"
                                >
                                    <RotateCcw
                                        size={14}
                                        className={`transition-transform duration-500 ${refreshing ? "-rotate-180 text-teal-400" : ""}`}
                                    />
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>

                                {/* Chat History Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowHistory((prev) => !prev)}
                                    title="View chat history & rechat"
                                    className={`flex items-center gap-1.5 text-xs font-mono px-2 sm:px-2.5 py-1.5 rounded transition-all active:scale-95 border ${
                                        showHistory
                                            ? "bg-teal-400 text-navy-900 border-teal-400 font-semibold"
                                            : "text-slate-light hover:text-teal-400 hover:bg-navy-800 border-transparent hover:border-navy-600"
                                    }`}
                                    aria-label="Chat history"
                                >
                                    <History size={14} />
                                    <span className="hidden sm:inline">History</span>
                                    {sessions.length > 0 && (
                                        <span
                                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                                showHistory
                                                    ? "bg-navy-900 text-teal-400"
                                                    : "bg-navy-800 text-teal-400 border border-teal-400/30"
                                            }`}
                                        >
                                            {sessions.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages or History Drawer */}
                        <div className="relative">
                            <AnimatePresence mode="wait">
                                {showHistory ? (
                                    <motion.div
                                        key="history-panel"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18 }}
                                        className="h-[22rem] sm:h-[25rem] md:h-[28rem] flex flex-col bg-navy-900"
                                    >
                                        {/* History Header */}
                                        <div className="p-3 sm:p-3.5 border-b border-navy-600 flex items-center justify-between bg-navy-900/95">
                                            <div className="flex items-center gap-2">
                                                <History size={15} className="text-teal-400" />
                                                <span className="text-xs sm:text-sm font-semibold text-slate-lighter font-mono">
                                                    Past Conversations
                                                </span>
                                                <span className="text-[10px] bg-teal-400/10 text-teal-400 border border-teal-400/20 px-2 py-0.5 rounded-full font-mono">
                                                    30-day retention
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleRefreshChat}
                                                    title="Start fresh conversation"
                                                    className="text-xs font-mono flex items-center gap-1 text-teal-400 hover:bg-teal-400/10 px-2 py-1 rounded transition-colors"
                                                >
                                                    <Plus size={13} />
                                                    <span className="hidden sm:inline">New Chat</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowHistory(false)}
                                                    title="Close history"
                                                    className="text-slate hover:text-slate-lighter p-1 hover:bg-navy-800 rounded transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* History List */}
                                        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-y-contain p-3 space-y-2">
                                            {sessions.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate">
                                                    <MessageSquare size={32} className="mb-2 text-navy-600" />
                                                    <p className="text-sm text-slate-light font-medium">
                                                        No previous chats yet
                                                    </p>
                                                    <p className="text-xs text-slate mt-1 max-w-xs leading-relaxed">
                                                        Your conversations are saved automatically for up to 30 days so you can rechat from them anytime.
                                                    </p>
                                                </div>
                                            ) : (
                                                sessions.map((session) => {
                                                    const isActive = session.id === sessionId;
                                                    const userMsgsCount = (session.messages || []).filter(
                                                        (m) => m.sender === "user"
                                                    ).length;

                                                    return (
                                                        <div
                                                            key={session.id}
                                                            onClick={() => handleSelectSession(session)}
                                                            className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                                                                isActive
                                                                    ? "bg-teal-400/10 border-teal-400/50 shadow-sm"
                                                                    : "bg-navy-800/80 border-navy-600/70 hover:border-teal-400/40 hover:bg-navy-800"
                                                            }`}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <MessageSquare
                                                                        size={13}
                                                                        className={isActive ? "text-teal-400" : "text-slate"}
                                                                    />
                                                                    <span className="text-xs sm:text-sm font-medium text-slate-lighter truncate block group-hover:text-teal-400 transition-colors">
                                                                        {session.title || "Conversation"}
                                                                    </span>
                                                                    {isActive && (
                                                                        <span className="text-[9px] uppercase tracking-wider bg-teal-400 text-navy-950 font-bold px-1.5 py-0.5 rounded shrink-0">
                                                                            Active
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2.5 text-[11px] text-slate font-mono">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock size={11} />
                                                                        {formatRelativeTime(
                                                                            session.updatedAt || session.createdAt
                                                                        )}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>
                                                                        {userMsgsCount} {userMsgsCount === 1 ? "query" : "queries"}
                                                                    </span>
                                                                    <span className="text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] ml-auto">
                                                                        Click to rechat →
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteSession(e, session.id)}
                                                                title="Delete conversation"
                                                                className="text-slate hover:text-red-400 p-1 rounded hover:bg-navy-700/60 opacity-50 group-hover:opacity-100 transition-all shrink-0"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* History Footer */}
                                        {sessions.length > 0 && (
                                            <div className="p-2.5 border-t border-navy-600 bg-navy-900 flex justify-between items-center text-[11px] text-slate font-mono px-4">
                                                <span>Auto-purged after 30 days</span>
                                                <button
                                                    type="button"
                                                    onClick={handleClearAllHistory}
                                                    className="text-slate hover:text-red-400 hover:underline transition-colors"
                                                >
                                                    Clear All History
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div
                                        key="chat-messages"
                                        ref={chatContainerRef}
                                        data-lenis-prevent
                                        className="h-[22rem] sm:h-[25rem] md:h-[28rem] overflow-y-auto overscroll-y-contain p-3 md:p-4 space-y-3 md:space-y-4 bg-navy-800"
                                    >
                                        <AnimatePresence>
                                            {messages.map((msg) => (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className={`flex ${
                                                        msg.sender === "user"
                                                            ? "justify-end"
                                                            : "justify-start"
                                                    }`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-lg text-sm break-words leading-relaxed ${
                                                            msg.sender === "user"
                                                                ? "bg-teal-400 text-navy-900 rounded-br-none font-medium"
                                                                : "bg-navy-600 text-slate-lighter rounded-bl-none"
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
                                                        transition={{
                                                            duration: 0.6,
                                                            repeat: Infinity,
                                                            delay: 0,
                                                        }}
                                                    />
                                                    <motion.span
                                                        className="w-2 h-2 bg-teal-400 rounded-full"
                                                        animate={{ y: [0, -6, 0] }}
                                                        transition={{
                                                            duration: 0.6,
                                                            repeat: Infinity,
                                                            delay: 0.15,
                                                        }}
                                                    />
                                                    <motion.span
                                                        className="w-2 h-2 bg-teal-400 rounded-full"
                                                        animate={{ y: [0, -6, 0] }}
                                                        transition={{
                                                            duration: 0.6,
                                                            repeat: Infinity,
                                                            delay: 0.3,
                                                        }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Chat Input */}
                        <form
                            onSubmit={handleSend}
                            className="p-3 md:p-4 bg-navy-900 border-t border-navy-600 flex space-x-2"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={
                                    showHistory
                                        ? "Select a chat above or type to start new..."
                                        : "Ask about Hetav..."
                                }
                                disabled={isTyping}
                                className="flex-1 bg-navy-800 text-slate-lighter px-3 md:px-4 py-2 rounded text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-teal-400 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isTyping || !input.trim()}
                                className="bg-teal-400 text-navy-900 p-2 rounded hover:bg-teal-300 transition-colors disabled:opacity-50"
                                aria-label="Send message"
                            >
                                {isTyping ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Send size={20} />
                                )}
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
