import React from 'react';
import { Linkedin, Github, FileText, FolderGit2, Globe, StickyNote } from 'lucide-react';
import { useRoute } from '../context/RouteContext';

const ICON = {
    linkedin: Linkedin,
    github: Github,
    resume: FileText,
    project: FolderGit2,
    site: Globe,
    faq: StickyNote,
};

/**
 * "Where this came from" chips under an agent reply. Each chip is one source
 * the model said it used (see server/lib/citations.js).
 */
const SourceChips = ({ sources }) => {
    const { setCurrentPage } = useRoute();
    if (!sources?.length) return null;

    // In-page anchors (#work, #achievements) live on the home page; the chat runs
    // on its own page, so switch back first and then scroll.
    const goToSection = (e, hash) => {
        e.preventDefault();
        setCurrentPage('home');
        setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 120);
    };
    return (
        <div className="mt-2.5 pt-2 border-t border-ink/10 flex flex-wrap gap-1.5">
            <span className="sr-only">Sources:</span>
            {sources.map((s) => {
                const Icon = ICON[s.type] ?? Globe;
                const external = s.url && /^https?:/.test(s.url);
                const chip = (
                    <>
                        <Icon size={11} strokeWidth={2} aria-hidden="true" />
                        {s.label}
                    </>
                );
                const cls =
                    'inline-flex items-center gap-1 font-mono text-[10.5px] px-2 py-1 rounded border border-ink/15 text-ink-2 bg-ice-panel';
                return s.url ? (
                    <a
                        key={s.id || s.label}
                        href={s.url}
                        target={external ? '_blank' : undefined}
                        rel={external ? 'noopener noreferrer' : undefined}
                        onClick={s.url.startsWith('#') ? (e) => goToSection(e, s.url) : undefined}
                        className={`${cls} hover:border-ink hover:text-ink transition-colors`}
                    >
                        {chip}
                    </a>
                ) : (
                    <span key={s.id || s.label} className={cls}>
                        {chip}
                    </span>
                );
            })}
        </div>
    );
};

export default SourceChips;
