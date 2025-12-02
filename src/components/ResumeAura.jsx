import React, { useEffect, useRef } from 'react';
import { useCursor } from '../context/CursorContext';

const ResumeAura = () => {
    const canvasRef = useRef(null);
    const { cursorState } = useCursor();
    const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const particles = useRef([]);
    const eye = useRef({ angle: 0, scale: 1 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const handleMouseMove = (e) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Resume keywords pool
        const defaultKeywords = ['Full-Stack', 'ML', 'Real-Time', 'React', 'Node.js', 'Python'];

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
            ctx.clearRect(0, 0, canvas.width, canvas.height);

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
                if (cursorState.keywords.length > 0) {
                    text = cursorState.keywords[Math.floor(Math.random() * cursorState.keywords.length)];
                } else {
                    text = defaultKeywords[Math.floor(Math.random() * defaultKeywords.length)];
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
    }, [cursorState]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-50 mix-blend-screen"
        />
    );
};

export default ResumeAura;
