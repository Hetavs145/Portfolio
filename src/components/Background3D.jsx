import React, { useEffect, useRef } from 'react';

const Background3D = () => {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    // Particles initialization
    const particles = [];
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        depth: Math.random() * 0.5 + 0.5 // For parallax
      });
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const drawRobot = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + Math.sin(time) * 10; // Gentle bobbing

      // --- Draw Particles (Background) ---
      particles.forEach(p => {
        // Move particles slightly based on mouse (Parallax)
        const moveX = (mouse.current.x - canvas.width / 2) * 0.05 * p.depth;
        const moveY = (mouse.current.y - canvas.height / 2) * 0.05 * p.depth;

        // Natural movement
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around screen
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x + moveX, p.y + moveY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 255, 218, ${0.3 * p.depth})`; // Teal tint
        ctx.fill();
      });

      // --- Robot Body (Bigger) ---
      const bodyWidth = 300; // Increased from 220
      const bodyHeight = 240; // Increased from 180
      const radius = 80;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Glow
      ctx.shadowColor = 'rgba(100, 255, 218, 0.4)';
      ctx.shadowBlur = 80;

      // Face Shape
      ctx.beginPath();
      ctx.roundRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight, radius);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      // --- Face Details ---

      // Eyes (Bigger & More Reactive)
      const eyeOffsetX = 70; // Spaced out more
      const eyeOffsetY = -15;
      const eyeSize = 35; // Bigger eyes

      // Calculate Eye Look Direction
      // "Back" (Navy) moves a bit
      const maxLookBack = 15;
      // "White Part" (Pupil/Reflection) moves MORE
      const maxLookFront = 25;

      const dx = mouse.current.x - centerX;
      const dy = mouse.current.y - centerY;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 800);

      const lookBackX = Math.cos(angle) * (dist / 800) * maxLookBack;
      const lookBackY = Math.sin(angle) * (dist / 800) * maxLookBack;

      const lookFrontX = Math.cos(angle) * (dist / 800) * maxLookFront;
      const lookFrontY = Math.sin(angle) * (dist / 800) * maxLookFront;

      // Left Eye
      ctx.beginPath();
      ctx.ellipse(-eyeOffsetX + lookBackX, eyeOffsetY + lookBackY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0a192f'; // Dark Navy Back
      ctx.fill();

      // Left Eye Pupil/Sparkle (Moves MORE)
      ctx.beginPath();
      ctx.arc(-eyeOffsetX + lookFrontX + 8, eyeOffsetY + lookFrontY - 8, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Right Eye
      ctx.beginPath();
      ctx.ellipse(eyeOffsetX + lookBackX, eyeOffsetY + lookBackY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0a192f';
      ctx.fill();

      // Right Eye Pupil/Sparkle (Moves MORE)
      ctx.beginPath();
      ctx.arc(eyeOffsetX + lookFrontX + 8, eyeOffsetY + lookFrontY - 8, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Cheeks (Blush)
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.ellipse(-eyeOffsetX, eyeOffsetY + 50, 20, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b6b'; // Soft Red
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(eyeOffsetX, eyeOffsetY + 50, 20, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b6b';
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Mouth (Tiny & Cute)
      ctx.beginPath();
      ctx.arc(0, 20, 10, 0.2, Math.PI - 0.2);
      ctx.strokeStyle = '#0a192f';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Antenna (Bobbing with head)
      ctx.beginPath();
      ctx.moveTo(0, -bodyHeight / 2);
      ctx.lineTo(0, -bodyHeight / 2 - 50);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      // Antenna Ball (Glowing)
      ctx.beginPath();
      ctx.arc(0, -bodyHeight / 2 - 50, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#64ffda';
      ctx.fill();
      ctx.shadowColor = '#64ffda';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      animationFrameId = requestAnimationFrame(drawRobot);
    };

    drawRobot();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-navy-900 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

export default Background3D;
