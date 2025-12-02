import React, { useEffect, useRef } from 'react';

const FluidCursor = () => {
    const canvasRef = useRef(null);
    const particles = useRef([]);
    const mouse = useRef({ x: 0, y: 0 });

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

            // Add particles on move
            for (let i = 0; i < 3; i++) {
                particles.current.push(createParticle(mouse.current.x, mouse.current.y));
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        const createParticle = (x, y) => {
            const size = Math.random() * 3 + 1;
            const speedX = Math.random() * 2 - 1;
            const speedY = Math.random() * 2 - 1;
            const color = `hsl(${Math.random() * 60 + 160}, 100%, 50%)`; // Teal to Blue range
            return { x, y, size, speedX, speedY, color, life: 1 };
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.current.forEach((p, index) => {
                p.x += p.speedX;
                p.y += p.speedY;
                p.life -= 0.02;
                p.size -= 0.05;

                if (p.life <= 0 || p.size <= 0) {
                    particles.current.splice(index, 1);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.life;
                    ctx.fill();
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
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-50 mix-blend-screen"
        />
    );
};

export default FluidCursor;
