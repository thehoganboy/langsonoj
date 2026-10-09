'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function MouseTrackerBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [cursorInside, setCursorInside] = useState(false);

  useEffect(() => {
    setMounted(true);
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    let targetX = window.innerWidth / 2;
    let targetY = 300;
    let currentX = targetX;
    let currentY = targetY;

    const handlePointerMove = (e: PointerEvent) => {
      setCursorInside(true);
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const handlePointerLeave = () => {
      setCursorInside(false);
    };

    // Smooth lerp update on animation frame
    const updatePosition = () => {
      // Lerp smoothing (0.15 for responsive yet silky glide)
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;

      if (container) {
        container.style.setProperty('--mouse-x', `${currentX.toFixed(1)}px`);
        container.style.setProperty('--mouse-y', `${currentY.toFixed(1)}px`);
      }

      rafId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);
    rafId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-700 ease-out"
      style={{
        opacity: cursorInside ? 1 : 0.6,
        // Fallback default coordinates
        ['--mouse-x' as any]: '50vw',
        ['--mouse-y' as any]: '300px',
      }}
    >
      {/* 1. Large Ambient Spotlight (Soft glow across the screen) */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `
            radial-gradient(
              750px circle at var(--mouse-x) var(--mouse-y),
              rgba(56, 189, 248, 0.11),
              rgba(99, 102, 241, 0.07) 35%,
              rgba(168, 85, 247, 0.03) 60%,
              transparent 80%
            )
          `,
        }}
      />

      {/* 2. Focused Neon Core Spotlight */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              320px circle at var(--mouse-x) var(--mouse-y),
              rgba(34, 211, 238, 0.14),
              rgba(59, 130, 246, 0.08) 50%,
              transparent 75%
            )
          `,
        }}
      />

      {/* 3. Subtle Cyber Dot Grid that reveals under the cursor */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage: `radial-gradient(rgba(148, 163, 184, 0.22) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          maskImage: `
            radial-gradient(
              550px circle at var(--mouse-x) var(--mouse-y),
              black 20%,
              rgba(0, 0, 0, 0.4) 60%,
              transparent 85%
            )
          `,
          WebkitMaskImage: `
            radial-gradient(
              550px circle at var(--mouse-x) var(--mouse-y),
              black 20%,
              rgba(0, 0, 0, 0.4) 60%,
              transparent 85%
            )
          `,
        }}
      />

      {/* 4. Tiny cursor luminous ring indicator */}
      <div
        className="absolute w-8 h-8 rounded-full border border-cyan-400/30 -translate-x-1/2 -translate-y-1/2 blur-[1px] transition-transform duration-75"
        style={{
          left: 'var(--mouse-x)',
          top: 'var(--mouse-y)',
          boxShadow: '0 0 20px 4px rgba(6, 182, 212, 0.25)',
        }}
      />
    </div>
  );
}
