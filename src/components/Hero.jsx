import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Background3D from './Background3D';
import MagneticButton from './MagneticButton';
import ResumeDropdown from './ResumeDropdown';
import { roles } from '../data/profile';

/** Wall clock in IST — the HUD's one piece of live telemetry. */
const LiveClock = () => {
    const fmt = () =>
        new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
    const [now, setNow] = useState(fmt);
    useEffect(() => {
        const id = setInterval(() => setNow(fmt()), 1000);
        return () => clearInterval(id);
    }, []);
    return <span className="tabular-nums">{now}</span>;
};

/** Mirrors Background3D's assembly progress (scrollY / (innerHeight * 2.5)). */
const useArmorPercent = () => {
    const [pct, setPct] = useState(0);
    useEffect(() => {
        const onScroll = () => {
            const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 2.5)));
            setPct(Math.round(p * 100));
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return pct;
};

/** Cycles through `roles` with an index counter, e.g. "03 / 07". */
const useRole = () => {
    const [i, setI] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setI((v) => (v + 1) % roles.length), 2200);
        return () => clearInterval(id);
    }, []);
    return i;
};

/**
 * Leader-line callout pointing at part of the robot. Positions are in vh
 * because the head is drawn at viewport centre and scales with viewport height.
 */
const Callout = ({ style, side = 'right', line = 80, title, value, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay, duration: 0.5 }}
        className={`hero-callout absolute items-center gap-2.5 ${side === 'left' ? 'flex-row-reverse' : ''}`}
        style={style}
        aria-hidden="true"
    >
        <span className="block w-[7px] h-[7px] rounded-full bg-ink" />
        <span className="block h-px bg-ink" style={{ width: line }} />
        <span className="label leading-[1.6] px-3 py-2 rounded-md border border-ink/20 bg-ice-panel/80 backdrop-blur-md whitespace-nowrap">
            <span className="block text-ink">{title}</span>
            <span className="block text-arc-deep">{value}</span>
        </span>
    </motion.div>
);

const Hero = () => {
    const armor = useArmorPercent();
    const roleIndex = useRole();
    const armorText =
        armor === 0 ? '0% — scroll to deploy' : armor >= 100 ? '100% — suited up' : `${armor}% — deploying`;

    return (
        <section id="hero" className="relative min-h-[100svh] overflow-hidden">
            {/* Reticle + soft glow. Rendered before the canvas so the robot sits
                on top of the rings rather than behind them. */}
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[100svh] pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_50%,rgba(250,251,252,0.95)_0%,rgba(250,251,252,0.55)_45%,transparent_75%)]" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(58vh,86vw)] aspect-square rounded-full border border-ink/15">
                    <span className="absolute left-1/2 -top-8 -bottom-8 w-px bg-ink/15" />
                    <span className="absolute top-1/2 -left-8 -right-8 h-px bg-ink/15" />
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(42vh,64vw)] aspect-square rounded-full border border-dashed border-arc/45" />
            </div>

            <Background3D />

            <div className="relative z-10 min-h-[100svh] pointer-events-none">
                {/* HUD frame */}
                <span className="hud-corner left-3 top-3 sm:left-5 sm:top-5 border-l-[1.5px] border-t-[1.5px] hidden sm:block" />
                <span className="hud-corner right-3 top-3 sm:right-5 sm:top-5 border-r-[1.5px] border-t-[1.5px] hidden sm:block" />
                <span className="hud-corner left-3 bottom-3 sm:left-5 sm:bottom-5 border-l-[1.5px] border-b-[1.5px]" />
                <span className="hud-corner right-3 bottom-3 sm:right-5 sm:bottom-5 border-r-[1.5px] border-b-[1.5px]" />

                {/* Telemetry row, just under the nav */}
                <div className="absolute left-0 right-0 top-[76px] md:top-[92px] px-5 sm:px-8 lg:px-10 flex justify-between label text-ink-mute">
                    <span>Ahmedabad, IN <span className="text-ink hidden sm:inline">23.02°N 72.57°E</span></span>
                    <span>IST <span className="text-ink"><LiveClock /></span></span>
                </div>

                {/* Name — stacked above the head on narrow / tall screens */}
                <h1 className="sr-only">Hetav Shah — full-stack &amp; agentic AI engineer</h1>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="hero-name hero-name--stack absolute left-0 right-0 top-[15svh] text-center text-ink"
                    aria-hidden="true"
                >
                    Hetav Shah
                </motion.div>

                {/* Name — flanking the head on wide screens */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="hero-name hero-name--flank absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-[3.5vw] text-ink"
                    aria-hidden="true"
                >
                    <span>Hetav</span>
                    <span>Shah</span>
                </motion.div>

                {/* Callouts around the head (wide screens only) */}
                <Callout
                    title="Antenna"
                    value="Signal: open to work"
                    line={90}
                    delay={0.6}
                    style={{ left: 'calc(50% + 6vh)', top: 'calc(50% - 25vh)' }}
                />
                <Callout
                    title="Optics"
                    value="Tracking cursor"
                    side="left"
                    line={70}
                    delay={0.75}
                    style={{ right: 'calc(50% + 12vh)', top: 'calc(50% + 15vh)' }}
                />
                <Callout
                    title="Armor"
                    value={armorText}
                    line={60}
                    delay={0.9}
                    style={{ left: 'calc(50% + 15vh)', top: 'calc(50% + 19vh)' }}
                />

                {/* Bottom row: positioning line · current mode · actions */}
                <div className="absolute left-0 right-0 bottom-8 sm:bottom-12 px-5 sm:px-8 lg:px-[60px] grid gap-4 lg:gap-10 lg:grid-cols-[1.2fr_1fr_1fr] items-end">
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-lg sm:text-[22px] leading-[1.4] tracking-[-0.01em] max-w-[460px] text-ink text-center lg:text-left mx-auto lg:mx-0"
                    >
                        Full-stack &amp; agentic AI engineer.{' '}
                        <span className="text-ink-mute">
                            I build multi-agent pipelines, real-time apps and the products around them.
                        </span>
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="hidden sm:block rounded-xl border border-ink/20 bg-ice-panel/75 backdrop-blur-md px-4 py-3.5 w-full max-w-[420px] mx-auto"
                    >
                        <div className="label text-ink-mute flex justify-between">
                            <span>Current mode</span>
                            <span className="tabular-nums">
                                {String(roleIndex + 1).padStart(2, '0')} / {String(roles.length).padStart(2, '0')}
                            </span>
                        </div>
                        <div className="mt-1.5 h-8 overflow-hidden relative">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={roleIndex}
                                    initial={{ y: 24, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -24, opacity: 0 }}
                                    transition={{ duration: 0.35, ease: 'easeOut' }}
                                    className="absolute inset-0 flex items-center justify-between text-[22px] font-medium tracking-[-0.02em] text-ink"
                                >
                                    {roles[roleIndex]}
                                    <span className="w-2.5 h-5 bg-arc" aria-hidden="true" />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="pointer-events-auto flex flex-col sm:flex-row gap-2.5 justify-center lg:justify-end"
                    >
                        <ResumeDropdown />
                        <MagneticButton href="#work" className="btn-ink w-full sm:w-auto">
                            View work <ArrowRight size={14} />
                        </MagneticButton>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
