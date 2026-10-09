'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
  hue: number;
}

export default function MouseTrackerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates tracking
    let mouseX = width / 2;
    let mouseY = height / 2;
    let smoothX = mouseX;
    let smoothY = mouseY;
    let isMoving = false;
    let moveTimeout: any = null;

    const particles: Particle[] = [];

    const handlePointerMove = (e: PointerEvent) => {
      // Ignore pure touch gestures to keep mobile clean
      if (e.pointerType === 'touch') return;

      setActive(true);
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMoving = true;

      if (moveTimeout) clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isMoving = false;
      }, 150);

      // Spawn glowing trail particles on movement
      const count = Math.random() < 0.6 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        if (particles.length < 45) {
          particles.push({
            x: mouseX + (Math.random() - 0.5) * 14,
            y: mouseY + (Math.random() - 0.5) * 14,
            size: Math.random() * 2.8 + 1.2,
            speedX: (Math.random() - 0.5) * 1.5,
            speedY: (Math.random() - 0.5) * 1.5 - 0.4,
            life: 0,
            maxLife: Math.random() * 25 + 25,
            hue: 185 + Math.random() * 45, // Cyan to sky blue
          });
        }
      }
    };

    const handlePointerLeave = () => {
      setActive(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);

    // Animation Loop
    const render = () => {
      // Lerp smooth follow
      smoothX += (mouseX - smoothX) * 0.18;
      smoothY += (mouseY - smoothY) * 0.18;

      // Update spotlight position
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${smoothX - 250}px, ${smoothY - 250}px, 0)`;
      }

      // Update ring follower
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${smoothX - 16}px, ${smoothY - 16}px, 0)`;
      }

      // Clear canvas with trail
      ctx.clearRect(0, 0, width, height);

      // Render & update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life++;

        const progress = p.life / p.maxLife;
        const opacity = Math.max(0, 1 - progress);
        const radius = p.size * (1 - progress * 0.5);

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${opacity * 0.8})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${opacity})`;
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(animId);
      if (moveTimeout) clearTimeout(moveTimeout);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
    >
      {/* 1. Large Luminous Spotlight Aura (Smooth follow) */}
      <div
        ref={spotlightRef}
        className={`absolute top-0 left-0 w-[500px] h-[500px] rounded-full transition-opacity duration-300 ease-out will-change-transform mix-blend-screen ${
          active ? 'opacity-100' : 'opacity-40'
        }`}
        style={{
          background: `
            radial-gradient(
              circle at center,
              rgba(34, 211, 238, 0.28) 0%,
              rgba(59, 130, 246, 0.18) 35%,
              rgba(99, 102, 241, 0.08) 60%,
              transparent 75%
            )
          `,
          filter: 'blur(35px)',
        }}
      />

      {/* 2. Core High-Intensity Cyber Glow */}
      <div
        ref={ringRef}
        className={`absolute top-0 left-0 w-8 h-8 rounded-full transition-opacity duration-200 ease-out will-change-transform ${
          active ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        {/* Subtle luminous halo ring */}
        <div className="w-full h-full rounded-full border border-cyan-400/60 shadow-[0_0_15px_3px_rgba(6,182,212,0.45)] animate-pulse" />
        {/* Center glowing bead */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_2px_rgba(103,232,249,0.9)]" />
      </div>

      {/* 3. Glowing Particle Trail Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
      />
    </div>
  );
}
