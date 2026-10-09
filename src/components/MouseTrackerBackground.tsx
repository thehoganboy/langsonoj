'use client';

import React, { useEffect, useRef } from 'react';

interface Bubble {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  wobblePhase: number;
  life: number;
  maxLife: number;
  hue: number;
}

interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  expansionSpeed: number;
  hue: number;
}

export default function MouseTrackerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fluidGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fluidGlow = fluidGlowRef.current;
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

    // Smooth coordinates
    let targetX = width / 2;
    let targetY = height / 3;
    let currentX = targetX;
    let currentY = targetY;
    let lastX = targetX;
    let lastY = targetY;
    let isVisible = false;

    const bubbles: Bubble[] = [];
    const ripples: WaterRipple[] = [];

    const onMove = (clientX: number, clientY: number) => {
      if (!isVisible) {
        isVisible = true;
        if (fluidGlow) fluidGlow.style.opacity = '1';
      }

      targetX = clientX;
      targetY = clientY;

      // Distance moved since last ripple
      const dx = clientX - lastX;
      const dy = clientY - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gợn sóng loang nước khi di chuyển chuột (Water Ripples)
      if (dist > 18) {
        lastX = clientX;
        lastY = clientY;

        if (ripples.length < 15) {
          ripples.push({
            x: clientX,
            y: clientY,
            radius: 8,
            maxRadius: Math.min(160, 60 + dist * 1.5),
            opacity: 0.55,
            expansionSpeed: 2.2 + Math.random() * 0.8,
            hue: 185 + Math.random() * 30, // Cyan-aqua
          });
        }
      }

      // Tạo bọt khí bơi theo sau con trỏ chuột (Aquatic Bubbles)
      const bubbleCount = Math.random() < 0.7 ? 2 : 1;
      for (let i = 0; i < bubbleCount; i++) {
        if (bubbles.length < 45) {
          bubbles.push({
            x: clientX + (Math.random() - 0.5) * 16,
            y: clientY + (Math.random() - 0.5) * 16,
            radius: Math.random() * 3.8 + 1.8,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -(Math.random() * 1.4 + 0.6), // Nổi lên trên như bọt nước
            wobbleSpeed: Math.random() * 0.08 + 0.05,
            wobbleAmp: Math.random() * 1.5 + 0.6,
            wobblePhase: Math.random() * Math.PI * 2,
            life: 0,
            maxLife: Math.random() * 35 + 30,
            hue: 182 + Math.random() * 35,
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
      if (fluidGlow) fluidGlow.style.opacity = '0.35';
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);
    document.addEventListener('mouseleave', handlePointerLeave);

    // Animation Loop
    let rafId: number;
    const render = () => {
      // Lerp smooth follow cho vùng loang nước
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;

      // Cập nhật vị trí vùng sáng loang nước hữu cơ
      if (fluidGlow) {
        fluidGlow.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. VẼ GỢN SÓNG LOANG NƯỚC (Expanding soft ripples)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.expansionSpeed;
        r.opacity *= 0.94; // Mờ dần khi loang rộng ra

        if (r.opacity <= 0.02 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${r.hue}, 90%, 65%, ${r.opacity * 0.5})`;
        ctx.lineWidth = Math.max(1, 3.5 * (1 - r.radius / r.maxRadius));
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${r.hue}, 100%, 60%, ${r.opacity * 0.8})`;
        ctx.stroke();
        ctx.restore();
      }

      // 2. VẼ BỌT NƯỚC THEO SAU (Translucent aquatic bubbles with glint)
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.life++;
        b.wobblePhase += b.wobbleSpeed;
        b.x += b.vx + Math.sin(b.wobblePhase) * b.wobbleAmp;
        b.y += b.vy;

        const progress = b.life / b.maxLife;
        const opacity = Math.max(0, 1 - progress);

        if (b.life >= b.maxLife) {
          bubbles.splice(i, 1);
          continue;
        }

        ctx.save();
        // Vòng ngoài bọt nước trong suốt
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${b.hue}, 95%, 75%, ${opacity * 0.85})`;
        ctx.lineWidth = 1.2;
        ctx.fillStyle = `hsla(${b.hue}, 90%, 60%, ${opacity * 0.18})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${b.hue}, 100%, 65%, ${opacity * 0.9})`;
        ctx.fill();
        ctx.stroke();

        // Điểm phản chiếu ánh sáng lấp lánh trên bọt nước
        ctx.beginPath();
        ctx.arc(
          b.x - b.radius * 0.35,
          b.y - b.radius * 0.35,
          Math.max(0.6, b.radius * 0.3),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
        ctx.fill();
        ctx.restore();
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
      {/* VÙNG ÁNH SÁNG LOANG NƯỚC HỮU CƠ (Organic fluid water morphing - Không viền, không hình tròn tĩnh) */}
      <div
        ref={fluidGlowRef}
        className="absolute top-0 left-0 w-[500px] h-[500px] will-change-transform mix-blend-screen opacity-75 transition-opacity duration-300"
      >
        {/* Lớp loang nước chính (Morphing wave layer 1) */}
        <div
          className="absolute inset-0 animate-water-morph-1"
          style={{
            background: `
              radial-gradient(
                ellipse at 45% 45%,
                rgba(34, 211, 238, 0.42) 0%,
                rgba(56, 189, 248, 0.26) 35%,
                rgba(99, 102, 241, 0.14) 55%,
                transparent 72%
              )
            `,
            filter: 'blur(45px)',
          }}
        />

        {/* Lớp loang nước thứ hai xoay ngược chiều (Morphing wave layer 2) */}
        <div
          className="absolute inset-4 animate-water-morph-2"
          style={{
            background: `
              radial-gradient(
                ellipse at 55% 55%,
                rgba(6, 182, 212, 0.36) 0%,
                rgba(14, 165, 233, 0.22) 40%,
                rgba(168, 85, 247, 0.1) 60%,
                transparent 75%
              )
            `,
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* CANVAS VẼ GỢN SÓNG LOANG VÀ BỌT NƯỚC (Ripples & Floating Bubbles) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
      />
    </div>
  );
}
