import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileText } from 'lucide-react';
import { resumes } from '../data/profile';

/** Gap between trigger and menu, and minimum distance kept from the viewport edge. */
const GAP = 8;
const EDGE = 12;

/**
 * "Get Resume" dropdown — two options, one shared source (src/data/profile.js).
 *
 * The menu is portalled to <body> with fixed positioning. It used to be an
 * absolutely-positioned child of the trigger, so any ancestor with
 * `overflow: hidden` (the hero section) cut it off: after a small scroll the
 * menu opened downward and the second item, the IMNU resume, was half hidden.
 * Up/down is now decided from the menu's real measured height against the
 * viewport, and the menu scrolls internally if neither side has room.
 *
 * `variant="nav"` renders the compact Navbar trigger (menu right-aligned); the
 * default renders the Hero / mobile-menu CTA (menu left-aligned to the trigger).
 */
const ResumeDropdown = ({ variant = 'cta', onNavigate }) => {
    const [open, setOpen] = useState(false);
    const [placement, setPlacement] = useState(null); // { style, upwards }
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const itemRefs = useRef([]);

    /** Position the menu next to the trigger, flipping up when it doesn't fit below. */
    const place = useCallback(() => {
        const trigger = triggerRef.current;
        const menu = menuRef.current;
        if (!trigger || !menu) return;

        const rect = trigger.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const width = Math.min(variant === 'nav' ? 256 : Math.max(rect.width, 288), vw - EDGE * 2);
        const height = menu.scrollHeight;

        const below = vh - rect.bottom - GAP - EDGE;
        const above = rect.top - GAP - EDGE;
        const upwards = height > below && above > below;
        const room = upwards ? above : below;

        let left = variant === 'nav' ? rect.right - width : rect.left;
        left = Math.min(Math.max(left, EDGE), vw - width - EDGE);

        setPlacement({
            upwards,
            style: {
                position: 'fixed',
                left,
                width,
                maxHeight: Math.max(room, 120),
                ...(upwards ? { bottom: vh - rect.top + GAP } : { top: rect.bottom + GAP }),
            },
        });
    }, [variant]);

    // Measure once the menu has rendered, before paint.
    useLayoutEffect(() => {
        if (open) place();
        else setPlacement(null);
    }, [open, place]);

    // Follow the trigger while open; close on outside press and Escape.
    useEffect(() => {
        if (!open) return undefined;

        const onPointerDown = (e) => {
            if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        window.addEventListener('scroll', place, { passive: true });
        window.addEventListener('resize', place);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('scroll', place);
            window.removeEventListener('resize', place);
        };
    }, [open, place]);

    const onTriggerKeyDown = (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
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

    const getFreshHref = (href) => {
        const base = href.split('?')[0];
        return base + '?v=' + Date.now();
    };

    const upwards = placement?.upwards ?? false;

    return (
        <div className={`relative ${variant === 'cta' ? 'w-full sm:w-auto' : 'inline-block'}`}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                onKeyDown={onTriggerKeyDown}
                aria-haspopup="menu"
                aria-expanded={open}
                className={variant === 'nav' ? 'btn-ink h-11 px-4' : 'btn-line w-full sm:w-auto'}
            >
                {variant === 'nav' ? 'Resume' : 'Get Resume'}
                <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {createPortal(
                <AnimatePresence>
                    {open && (
                        <motion.div
                            ref={menuRef}
                            role="menu"
                            data-lenis-prevent
                            initial={{ opacity: 0, y: upwards ? 8 : -8, scale: 0.97 }}
                            animate={{ opacity: placement ? 1 : 0, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: upwards ? 8 : -8, scale: 0.97 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            // Until measured, render off-screen so the first frame can't flash in the wrong place.
                            style={placement?.style ?? { position: 'fixed', top: -9999, left: 0, width: 288 }}
                            className="glass rounded-lg p-1.5 z-[60] overflow-y-auto overscroll-contain"
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
                                    <FileText size={16} className="mt-0.5 shrink-0 text-arc-deep" />
                                    <span className="min-w-0">
                                        <span className="block font-mono text-[13px] text-ink group-hover:text-arc-deep transition-colors">
                                            {r.label}
                                        </span>
                                        <span className="block text-xs text-ink-mute mt-0.5">{r.description}</span>
                                    </span>
                                </a>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </div>
    );
};

export default ResumeDropdown;
