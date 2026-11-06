import React, { useState } from 'react';
import { Loader2, Sparkles, Send, Check } from 'lucide-react';
import { streamAgent, postAgent } from '../lib/agentClient';
import SourceChips from './SourceChips';

const MIN_JD = 80;

/**
 * Recruiter mode: paste a job description, get an honest fit summary from the
 * same knowledge base as the chat, then optionally leave contact details —
 * which reach Hetav via his notification webhook (Hermes / Telegram).
 */
const RecruiterMode = () => {
    const [jd, setJd] = useState('');
    const [fit, setFit] = useState('');
    const [sources, setSources] = useState([]);
    const [checking, setChecking] = useState(false);
    const [fitError, setFitError] = useState('');

    const [lead, setLead] = useState({ name: '', email: '', company: '', message: '', website: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [leadError, setLeadError] = useState('');

    const checkFit = async (e) => {
        e.preventDefault();
        if (jd.trim().length < MIN_JD || checking) return;
        setChecking(true);
        setFit('');
        setSources([]);
        setFitError('');
        let streamed = '';
        try {
            const data = await streamAgent('/api/fit', { jd }, {
                onToken: (t) => {
                    streamed += t;
                    setFit(streamed);
                },
            });
            setFit(data.message);
            setSources(data.sources || []);
        } catch (err) {
            setFitError(err.message || 'Something went wrong — try again in a moment.');
        } finally {
            setChecking(false);
        }
    };

    const sendLead = async (e) => {
        e.preventDefault();
        if (sending) return;
        setSending(true);
        setLeadError('');
        try {
            await postAgent('/api/lead', { ...lead, fit });
            setSent(true);
        } catch (err) {
            setLeadError(err.message);
        } finally {
            setSending(false);
        }
    };

    const field =
        'w-full bg-ice-hi border border-ink/20 rounded-md px-3 py-2.5 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:border-ink';

    return (
        <div className="space-y-4">
            <form onSubmit={checkFit} className="rounded-xl border-[1.5px] border-ink bg-ice-panel/90 backdrop-blur-md p-4 sm:p-5">
                <label htmlFor="jd" className="label text-ink block mb-1">Job description</label>
                <p className="text-[13px] text-ink-mute mb-3">
                    Paste a role and get an honest read on how my experience lines up — matches, near-misses and gaps.
                </p>
                <textarea
                    id="jd"
                    data-lenis-prevent
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    rows={7}
                    maxLength={8000}
                    placeholder="e.g. We're hiring an AI engineer to build LLM agents with LangGraph and ship them in Next.js…"
                    className={`${field} resize-y min-h-[140px] font-sans`}
                />
                <div className="flex items-center justify-between mt-3 gap-3">
                    <span className="label text-ink-mute tabular-nums">
                        {jd.trim().length < MIN_JD ? `${MIN_JD - jd.trim().length} more chars` : `${jd.length} / 8000`}
                    </span>
                    <button type="submit" disabled={checking || jd.trim().length < MIN_JD} className="btn-ink h-11 disabled:opacity-40">
                        {checking ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {checking ? 'Checking' : 'Check fit'}
                    </button>
                </div>
            </form>

            {(fit || fitError) && (
                <div className="rounded-xl border border-ink/20 bg-ice-hi p-4 sm:p-5" aria-live="polite">
                    <div className="label text-ink-mute mb-2">Fit summary</div>
                    {fitError ? (
                        <p className="text-sm text-hot">{fitError}</p>
                    ) : (
                        <p className="text-[14.5px] leading-relaxed text-ink whitespace-pre-line">
                            {fit}
                            {checking && <span className="inline-block w-1.5 h-3.5 ml-0.5 align-[-2px] bg-arc animate-pulse" aria-hidden="true" />}
                        </p>
                    )}
                    {!checking && <SourceChips sources={sources} />}
                </div>
            )}

            <div className="rounded-xl border border-ink/20 bg-ice-panel/90 backdrop-blur-md p-4 sm:p-5">
                <div className="label text-ink mb-1">Leave your email</div>
                <p className="text-[13px] text-ink-mute mb-3">
                    I get a ping straight away{fit ? ' along with the fit summary above' : ''}, and I'll reply personally.
                </p>
                {sent ? (
                    <p className="flex items-center gap-2 text-sm text-ink">
                        <Check size={16} className="text-arc-deep" /> Thanks — it's on its way to me. Talk soon.
                    </p>
                ) : (
                    <form onSubmit={sendLead} className="grid sm:grid-cols-2 gap-2.5">
                        <input className={field} placeholder="Your name" required maxLength={120} value={lead.name}
                            onChange={(e) => setLead({ ...lead, name: e.target.value })} aria-label="Your name" />
                        <input className={field} type="email" placeholder="Work email" required maxLength={200} value={lead.email}
                            onChange={(e) => setLead({ ...lead, email: e.target.value })} aria-label="Work email" />
                        <input className={`${field} sm:col-span-2`} placeholder="Company (optional)" maxLength={160} value={lead.company}
                            onChange={(e) => setLead({ ...lead, company: e.target.value })} aria-label="Company" />
                        <textarea className={`${field} sm:col-span-2 resize-y`} rows={3} placeholder="Anything you'd like me to know (optional)" maxLength={1500}
                            value={lead.message} onChange={(e) => setLead({ ...lead, message: e.target.value })} aria-label="Message" data-lenis-prevent />
                        {/* Honeypot: hidden from people, filled by bots. */}
                        <input type="text" tabIndex={-1} autoComplete="off" value={lead.website}
                            onChange={(e) => setLead({ ...lead, website: e.target.value })}
                            className="absolute -left-[9999px] w-px h-px opacity-0" aria-hidden="true" />
                        <div className="sm:col-span-2 flex items-center justify-between gap-3">
                            <span className="text-[13px] text-hot">{leadError}</span>
                            <button type="submit" disabled={sending} className="btn-ink h-11 disabled:opacity-40">
                                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Send
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RecruiterMode;
