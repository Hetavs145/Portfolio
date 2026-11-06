import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileText } from 'lucide-react';
import { resumes } from '../data/profile';

/**
 * "Get Resume" dropdown — two options, one shared source (src/data/profile.js).
 *
 * The codebase had no dropdown pattern to reuse, so this is built from pieces
 * already here: AnimatePresence (as used in RealTimeDemo), the .glass utility
 * from index.css, and lucide icons.
 *
 * `variant="nav"` renders the compact Navbar trigger; the default renders the
 * solid Hero CTA.
 */
const ResumeDropdown = ({ variant = 'cta', onNavigate }) => {
    const [open, setOpen] = useState(false);
    const [openUpwards, setOpenUpwards] = useState(false);
    const containerRef = useRef(null);
    const itemRefs = useRef([]);

    // Close on outside click and on Escape — a dropdown that only closes by
    // re-clicking the trigger feels broken, especially on touch.
    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const toggleOpen = () => {
        if (!open && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // If less than 220px below trigger, open upwards to avoid clipping on mobile
            setOpenUpwards(window.innerHeight - rect.bottom < 220);
        }
        setOpen((v) => !v);
    };

    const onTriggerKeyDown = (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setOpenUpwards(window.innerHeight - rect.bottom < 220);
            }
            setOpen(true);
            requestAnimationFrame(() => itemRefs.current[0]?.focus());
        }
    };

    const onItemKeyDown = (e, i) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            itemRefs.current[(i + 1) % resumes.length]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            itemRefs.current[(i - 1 + resumes.length) % resumes.length]?.focus();
        }
    };

    const isUpwards = variant !== 'nav' && openUpwards;

    const triggerClass =
        variant === 'nav'
            ? 'btn-ink h-11 px-4'
            : 'btn-line w-full sm:w-auto';

    const menuPositionClass =
        variant === 'nav'
            ? 'top-full mt-2 right-0 w-64 max-w-[calc(100vw-3rem)]'
            : isUpwards
                ? 'bottom-full mb-2 left-0 right-0 w-full sm:w-72 sm:left-0 sm:right-auto'
                : 'top-full mt-2 left-0 right-0 w-full sm:w-72 sm:left-0 sm:right-auto';

    const getFreshHref = (href) => {
        const base = href.split('?')[0];
        return base + '?v=' + Date.now();
    };

    return (
        <div
            ref={containerRef}
            className={`relative ${variant === 'cta' ? 'w-full sm:w-auto' : 'inline-block'}`}
        >
            <button
                type="button"
                onClick={toggleOpen}
                onKeyDown={onTriggerKeyDown}
                aria-haspopup="menu"
                aria-expanded={open}
                className={triggerClass}
            >
                {variant === 'nav' ? 'Résumé' : 'Get résumé'}
                <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: isUpwards ? 8 : -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: isUpwards ? 8 : -8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className={`glass absolute ${menuPositionClass} rounded-lg p-1.5 z-50`}
                    >
                        {resumes.map((r, i) => (
                            <a
                                key={r.href}
                                ref={(el) => (itemRefs.current[i] = el)}
                                href={getFreshHref(r.href)}
                                target="_blank"
                                rel="noopener noreferrer"
                                role="menuitem"
                                onKeyDown={(e) => onItemKeyDown(e, i)}
                                onPointerDown={(e) => {
                                    e.currentTarget.href = getFreshHref(r.href);
                                }}
                                onClick={(e) => {
                                    e.currentTarget.href = getFreshHref(r.href);
                                    setOpen(false);
                                    onNavigate?.();
                                }}
                                className="flex items-start gap-3 rounded-md px-3 py-2.5 text-left hover:bg-ink/[0.05] focus:bg-ink/[0.05] focus:outline-none transition-colors group"
                            >
                                <FileText
                                    size={16}
                                    className="mt-0.5 shrink-0 text-arc-deep"
                                />
                                <span className="min-w-0">
                                    <span className="block font-mono text-[13px] text-ink group-hover:text-arc-deep transition-colors">
                                        {r.label}
                                    </span>
                                    <span className="block text-xs text-ink-mute mt-0.5">
                                        {r.description}
                                    </span>
                                </span>
                            </a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResumeDropdown;
