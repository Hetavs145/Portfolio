import React, { useEffect, useRef, useState } from 'react';
import { useCursor } from '../context/CursorContext';
import { cursorKeywords } from '../data/profile';

/**
 * Custom canvas cursor. Renders ONLY on devices with a real pointer.
 *
 * On touch devices there is no mousemove, so `mouse` never updated and the eye
 * sat parked at screen centre spraying keyword particles over the content
 * forever, at z-50, with rAF running non-stop. Now it simply doesn't mount.
 */
const ResumeAura = () => {
    const canvasRef = useRef(null);
    const { cursorState } = useCursor();
    const mouse = useRef({ x: 0, y: 0 });

    // Keep the latest cursorState in a ref. Reading it through the effect's dep
    // array tore down and rebuilt the whole animation loop on every hover.
    const stateRef = useRef(cursorState);
    stateRef.current = cursorState;

    const [hasFinePointer, setHasFinePointer] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(pointer: fine)');
        const apply = () => setHasFinePointer(mq.matches);
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);
    const particles = useRef([]);
    const eye = useRef({ angle: 0, scale: 1 });

    useEffect(() => {
        if (!hasFinePointer) return undefined;

        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Size the bitmap to devicePixelRatio, or the cursor is blurry on any
        // 2x/3x display. clientWidth excludes the scrollbar; innerWidth does not.
        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = document.documentElement.clientWidth;
            const h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const handleMouseMove = (e) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };

        window.addEventListener('mousemove', handleMouseMove);


        const createParticle = (x, y, text) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 0.5;
            return {
                x,
                y,
                text,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: Math.random() * 10 + 10,
                color: `hsl(${Math.random() * 60 + 160}, 100%, 70%)`
            };
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);  // cleared in device px before transform applies

            // Update Eye
            const dx = mouse.current.x - canvas.width / 2;
            const dy = mouse.current.y - canvas.height / 2;
            eye.current.angle = Math.atan2(dy, dx);

            // Eye Core
            ctx.save();
            ctx.translate(mouse.current.x, mouse.current.y);
            ctx.rotate(eye.current.angle);

            // Outer Ring
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.strokeStyle = '#64ffda';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner Core (Pupil)
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#64ffda';
            ctx.fill();

            // Scanning Line
            ctx.beginPath();
            ctx.moveTo(0, -25);
            ctx.lineTo(0, 25);
            ctx.strokeStyle = 'rgba(100, 255, 218, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();

            // Spawn Particles based on state
            if (Math.random() < 0.1) {
                let text = '';
                if (stateRef.current.keywords.length > 0) {
                    const kw = stateRef.current.keywords;
                    text = kw[Math.floor(Math.random() * kw.length)];
                } else {
                    text = cursorKeywords[Math.floor(Math.random() * cursorKeywords.length)];
                }
                particles.current.push(createParticle(mouse.current.x, mouse.current.y, text));
            }

            // Update & Draw Particles
            particles.current.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.01;
                p.size *= 0.99;

                if (p.life <= 0) {
                    particles.current.splice(index, 1);
                } else {
                    ctx.font = `${p.size}px "Fira Code", monospace`;
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.life;
                    ctx.fillText(p.text, p.x, p.y);
                    ctx.globalAlpha = 1;
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [hasFinePointer]);

    if (!hasFinePointer) return null;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999]"
        />
    );
};

export default ResumeAura;
