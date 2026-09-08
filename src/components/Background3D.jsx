import React, { useEffect, useRef } from 'react';

/**
 * Background3D
 * 
 * 1st Viewport (Opening Site / scroll = 0):
 * Strictly preserves the EXACT original cute robot head, mouse-tracking pupils,
 * pink blush cheeks, mouth, antenna with glowing ball, and floating particles.
 * 
 * As User Scrolls:
 * Assembles the full Mark armor suit around the cute robot:
 *  1. Hands & gauntlets fly in laterally with glowing cyan repulsors
 *  2. Center torso (chest with glowing Arc Reactor + stomach) locks in
 *  3. Legs articulate up from below
 *  4. Boots snap into position with cyan thrusters
 * 
 * Subsequent Viewports (About, Experience, Achievements, Projects, Contact):
 * Smoothly rotates the assembled suit in 3D turntable perspective, settling into
 * stable resting poses tailored to each section.
 */
const Background3D = () => {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef({ y: 0, progress: 0, assemblyProgress: 0, totalProgress: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    // Particle initialization (exact original count and depth)
    const particles = [];
    const particleCount = 60;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        depth: Math.random() * 0.5 + 0.5
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
      mouse.current.targetX = e.clientX - rect.left;
      mouse.current.targetY = e.clientY - rect.top;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const heroHeight = window.innerHeight;

      scrollRef.current.y = scrollY;
      // Assembly progress in Hero: 0 -> 1 over first 70% of viewport scroll
      scrollRef.current.assemblyProgress = Math.min(1, Math.max(0, scrollY / (heroHeight * 0.70)));
      // Overall scroll progress for turntable rotation
      scrollRef.current.totalProgress = docHeight > 0 ? scrollY / docHeight : 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Smoothed spring state for rotation and positioning
    const suitState = {
      currentAngle: 0,
      targetAngle: 0,
      offsetX: 0,
      targetOffsetX: 0,
      assemblyEased: 0
    };

    const render = () => {
      time += 0.02;

      // Smooth mouse follow with spring damping
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isMobile = canvas.width < 768;
      const scale = isMobile ? 0.75 : 1;

      // Determine assembly progress and smooth it
      const rawAssembly = scrollRef.current.assemblyProgress || 0;
      suitState.assemblyEased += (rawAssembly - suitState.assemblyEased) * 0.08;
      const assembly = suitState.assemblyEased;

      // Section based target rotations past Hero
      const totalProg = scrollRef.current.totalProgress || 0;
      let targetRot = 0;
      let targetShiftX = 0;

      if (assembly >= 0.92) {
        if (totalProg < 0.18) {
          targetRot = 0; // Front assembled
          targetShiftX = 0;
        } else if (totalProg < 0.38) {
          // About Section: rotate 32 deg, shift to right side on desktop
          targetRot = 0.55;
          targetShiftX = isMobile ? 0 : canvas.width * 0.22;
        } else if (totalProg < 0.58) {
          // Experience Section: rotate -35 deg, shift to left side
          targetRot = -0.60;
          targetShiftX = isMobile ? 0 : -canvas.width * 0.20;
        } else if (totalProg < 0.78) {
          // Achievements: rotate 180 deg (rear thruster / power conduits)
          targetRot = Math.PI;
          targetShiftX = isMobile ? 0 : canvas.width * 0.20;
        } else if (totalProg < 0.92) {
          // Projects: front battle stance
          targetRot = 0;
          targetShiftX = 0;
        } else {
          // Contact: slight hover elevation
          targetRot = 0.15;
          targetShiftX = 0;
        }
      }

      suitState.currentAngle += (targetRot - suitState.currentAngle) * 0.05;
      suitState.offsetX += (targetShiftX - suitState.offsetX) * 0.05;

      const centerX = canvas.width / 2 + suitState.offsetX;
      const bobbing = Math.sin(time) * 10;
      const centerY = canvas.height / 2 + bobbing;

      // --- Draw Particles (Background) - EXACT ORIGINAL FUNCTION ---
      particles.forEach(p => {
        const moveX = (mouse.current.x - canvas.width / 2) * 0.05 * p.depth;
        const moveY = (mouse.current.y - canvas.height / 2) * 0.05 * p.depth;

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x + moveX, p.y + moveY, p.size, 0, Math.PI * 2);
        // Taste-skill arc cyan / teal tint
        ctx.fillStyle = `rgba(56, 189, 248, ${0.35 * p.depth})`;
        ctx.fill();
      });

      // --- SUIT ASSEMBLY / 3D TURNTABLE RENDERING ---
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);

      // Apply 3D perspective rotation around Y axis
      const cosRot = Math.cos(suitState.currentAngle);

      // 1. If user scrolls and armor is assembling:
      if (assembly > 0.01) {
        const handOffset = (1 - assembly) * 500;
        const chestOffset = (1 - assembly) * 350;
        const legOffset = (1 - assembly) * 480;
        const bootOffset = (1 - assembly) * 620;

        ctx.save();
        // Perspective turntable transform
        ctx.scale(cosRot, 1);

        // --- Center Torso Armor (Chest Plate + Arc Reactor + Stomach) ---
        ctx.save();
        ctx.translate(0, 140 + chestOffset);

        // Armor plate backdrop
        ctx.fillStyle = '#991b1b'; // Mark crimson
        ctx.beginPath();
        ctx.roundRect(-110, -50, 220, 160, [10, 10, 40, 40]);
        ctx.fill();

        // Titanium Gold Insets
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.roundRect(-90, 40, 180, 50, 8);
        ctx.fill();

        // Abdominal Segments (Stomach)
        for (let s = 0; s < 3; s++) {
          ctx.fillStyle = s % 2 === 0 ? '#b45309' : '#7f1d1d';
          ctx.beginPath();
          ctx.roundRect(-70 + s * 5, 95 + s * 16, 140 - s * 10, 12, 4);
          ctx.fill();
        }

        // Circular Arc Reactor Core (Glowing cyan)
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 25 + Math.sin(time * 4) * 8;

        // Outer Arc ring
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f59e0b'; // Gold rim
        ctx.stroke();

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        // Core crystalline center
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        ctx.restore(); // end torso

        // --- Legs & Thighs ---
        ctx.save();
        ctx.translate(0, 260 + legOffset);
        // Left Leg
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.roundRect(-85, 0, 60, 120, [15, 15, 10, 10]);
        ctx.fill();
        // Right Leg
        ctx.beginPath();
        ctx.roundRect(25, 0, 60, 120, [15, 15, 10, 10]);
        ctx.fill();

        // Gold knee guards
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(-55, 60, 18, 0, Math.PI * 2);
        ctx.arc(55, 60, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore(); // end legs

        // --- Ankles & Boots (with Thrusters) ---
        ctx.save();
        ctx.translate(0, 380 + bootOffset);
        // Left boot
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.roundRect(-95, 0, 75, 45, [10, 10, 15, 15]);
        ctx.fill();
        // Right boot
        ctx.beginPath();
        ctx.roundRect(20, 0, 75, 45, [10, 10, 15, 15]);
        ctx.fill();

        // Downward Repulsor Thruster Flares
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.ellipse(-57, 45, 16, 25 + Math.random() * 10, 0, 0, Math.PI * 2);
        ctx.ellipse(57, 45, 16, 25 + Math.random() * 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-57, 45, 8, 14, 0, 0, Math.PI * 2);
        ctx.ellipse(57, 45, 8, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore(); // end boots

        // --- Hands & Armored Gauntlets (Fly in laterally from sides) ---
        // Left Gauntlet
        ctx.save();
        ctx.translate(-160 - handOffset, 120);
        ctx.rotate(0.2 + (1 - assembly) * 0.5);
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.roundRect(-35, -40, 70, 110, 16);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(-30, 20, 60, 30, 8);
        ctx.fill();
        // Palm Repulsor (glowing cyan)
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 35, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 35, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
        ctx.restore();

        // Right Gauntlet
        ctx.save();
        ctx.translate(160 + handOffset, 120);
        ctx.rotate(-0.2 - (1 - assembly) * 0.5);
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.roundRect(-35, -40, 70, 110, 16);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(-30, 20, 60, 30, 8);
        ctx.fill();
        // Palm Repulsor (glowing cyan)
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 35, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 35, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
        ctx.restore();

        ctx.restore(); // end perspective
      }

      // --- CUTE ROBOT HEAD: 100% STRICTLY IDENTICAL TO ORIGINAL ON 1ST VIEWPORT ---
      // In 1st viewport (assembly = 0), this is the ONLY thing drawn, with exact original dimensions!
      ctx.save();
      if (assembly >= 0.92) {
        ctx.scale(cosRot, 1);
      }

      // Glow (Original)
      ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
      ctx.shadowBlur = 80;

      // Face Shape (Original bodyWidth 300, bodyHeight 240, radius 80)
      const bodyWidth = 300;
      const bodyHeight = 240;
      const radius = 80;

      ctx.beginPath();
      ctx.roundRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight, radius);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      // --- Face Details ---
      const eyeOffsetX = 70;
      const eyeOffsetY = -15;
      const eyeSize = 35;

      // Eye look direction calculation (Original mouse tracking)
      const maxLookBack = 15;
      const maxLookFront = 25;

      const dx = mouse.current.x - centerX;
      const dy = mouse.current.y - centerY;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 800);

      const lookBackX = Math.cos(angle) * (dist / 800) * maxLookBack;
      const lookBackY = Math.sin(angle) * (dist / 800) * maxLookBack;

      const lookFrontX = Math.cos(angle) * (dist / 800) * maxLookFront;
      const lookFrontY = Math.sin(angle) * (dist / 800) * maxLookFront;

      // Left Eye (Original)
      ctx.beginPath();
      ctx.ellipse(-eyeOffsetX + lookBackX, eyeOffsetY + lookBackY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0a192f'; // Dark Navy Back
      ctx.fill();

      // Left Eye Pupil/Sparkle (Original)
      ctx.beginPath();
      ctx.arc(-eyeOffsetX + lookFrontX + 8, eyeOffsetY + lookFrontY - 8, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Right Eye (Original)
      ctx.beginPath();
      ctx.ellipse(eyeOffsetX + lookBackX, eyeOffsetY + lookBackY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0a192f';
      ctx.fill();

      // Right Eye Pupil/Sparkle (Original)
      ctx.beginPath();
      ctx.arc(eyeOffsetX + lookFrontX + 8, eyeOffsetY + lookFrontY - 8, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Cheeks (Blush - Original #ff6b6b)
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.ellipse(-eyeOffsetX, eyeOffsetY + 50, 20, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b6b';
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(eyeOffsetX, eyeOffsetY + 50, 20, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b6b';
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Mouth (Tiny & Cute - Original)
      ctx.beginPath();
      ctx.arc(0, 20, 10, 0.2, Math.PI - 0.2);
      ctx.strokeStyle = '#0a192f';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Antenna (Bobbing with head - Original)
      ctx.beginPath();
      ctx.moveTo(0, -bodyHeight / 2);
      ctx.lineTo(0, -bodyHeight / 2 - 50);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      // Antenna Ball (Glowing - Original)
      ctx.beginPath();
      ctx.arc(0, -bodyHeight / 2 - 50, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore(); // end head

      ctx.restore(); // end main transform

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-navy-950 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

export default Background3D;
