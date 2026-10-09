'use client';

import React, { useEffect, useRef } from 'react';

export default function MouseTrackerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const spotlight = spotlightRef.current;
    const cursorDot = cursorDotRef.current;
    const cursorRing = cursorRingRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initial Coordinates
    let targetX = width / 2;
    let targetY = height / 3;
    let currentX = targetX;
    let currentY = targetY;
    let isVisible = false;

    // Particles array
    interface Particle {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      hue: number;
    }
    const particles: Particle[] = [];

    const onMove = (clientX: number, clientY: number) => {
      if (!isVisible) {
        isVisible = true;
        if (spotlight) spotlight.style.opacity = '1';
        if (cursorDot) cursorDot.style.opacity = '1';
        if (cursorRing) cursorRing.style.opacity = '1';
      }

      targetX = clientX;
      targetY = clientY;

      // Spawn stardust glowing particles
      const count = Math.random() < 0.65 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        if (particles.length < 50) {
          particles.push({
            x: clientX + (Math.random() - 0.5) * 12,
            y: clientY + (Math.random() - 0.5) * 12,
            size: Math.random() * 2.5 + 1.2,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.3,
            life: 0,
            maxLife: Math.random() * 25 + 25,
            hue: 185 + Math.random() * 45, // Cyan to electric blue
          });
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      onMove(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      onMove(e.clientX, e.clientY);
    };

    const handlePointerLeave = () => {
      isVisible = false;
      if (spotlight) spotlight.style.opacity = '0.35';
      if (cursorDot) cursorDot.style.opacity = '0';
      if (cursorRing) cursorRing.style.opacity = '0';
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);
    document.addEventListener('mouseleave', handlePointerLeave);

    // Animation loop (GPU accelerated via RAF)
    let rafId: number;
    const render = () => {
      // Lerp smooth follow
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;

      // Update spotlight position
      if (spotlight) {
        spotlight.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
      }

      // Update cursor dot (instant follow)
      if (cursorDot) {
        cursorDot.style.transform = `translate3d(${targetX - 4}px, ${targetY - 4}px, 0)`;
      }

      // Update cursor ring (smooth spring follow)
      if (cursorRing) {
        cursorRing.style.transform = `translate3d(${currentX - 16}px, ${currentY - 16}px, 0)`;
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Render & update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const progress = p.life / p.maxLife;
        const opacity = Math.max(0, 1 - progress);
        const radius = p.size * (1 - progress * 0.5);

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${opacity * 0.9})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${opacity})`;
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('mouseleave', handlePointerLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
    >
      {/* 1. Large Luminous Spotlight Aura */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full will-change-transform mix-blend-screen opacity-70 transition-opacity duration-300"
        style={{
          background: `
            radial-gradient(
              circle at center,
              rgba(34, 211, 238, 0.45) 0%,
              rgba(59, 130, 246, 0.28) 35%,
              rgba(139, 92, 246, 0.15) 60%,
              transparent 75%
            )
          `,
          filter: 'blur(35px)',
        }}
      />

      {/* 2. Outer Smooth Follower Ring */}
      <div
        ref={cursorRingRef}
        className="absolute top-0 left-0 w-8 h-8 rounded-full will-change-transform opacity-0 transition-opacity duration-200 border-2 border-cyan-400/80 shadow-[0_0_15px_3px_rgba(6,182,212,0.6)]"
      />

      {/* 3. Center Glowing Neon Dot */}
      <div
        ref={cursorDotRef}
        className="absolute top-0 left-0 w-2 h-2 rounded-full will-change-transform opacity-0 transition-opacity duration-150 bg-cyan-300 shadow-[0_0_10px_3px_rgba(34,211,238,0.9)]"
      />

      {/* 4. Canvas Particle Stardust Trail */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
      />
    </div>
  );
}
