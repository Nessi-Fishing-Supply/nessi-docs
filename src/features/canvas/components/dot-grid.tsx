'use client';

import { useRef, useEffect } from 'react';

const DOT_SPACING = 14;
const BASE_RADIUS = 0.6;
const MAX_RADIUS = 1.4;
const GLOW_RADIUS = 120;
const BASE_ALPHA = 0.18;
const MAX_ALPHA = 0.35;
const DOT_COLOR = { r: 180, g: 178, b: 172 };

export function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef<number>(0);
  const needsDrawRef = useRef(true);
  // Cache the base dot image to avoid redrawing thousands of identical dots
  const baseCacheRef = useRef<ImageBitmap | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let dpr = 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      baseCacheRef.current = null; // invalidate cache on resize
      needsDrawRef.current = true;
    };

    const drawBase = () => {
      // Draw all base dots to an offscreen canvas, then cache as ImageBitmap
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return null;
      const offscreen = new OffscreenCanvas(w * dpr, h * dpr);
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;
      offCtx.scale(dpr, dpr);

      const cols = Math.ceil(w / DOT_SPACING);
      const rows = Math.ceil(h / DOT_SPACING);
      offCtx.fillStyle = `rgba(255,255,255,${BASE_ALPHA})`;

      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          offCtx.beginPath();
          offCtx.arc(col * DOT_SPACING, row * DOT_SPACING, BASE_RADIUS, 0, Math.PI * 2);
          offCtx.fill();
        }
      }

      return createImageBitmap(offscreen);
    };

    const draw = () => {
      if (!needsDrawRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      needsDrawRef.current = false;

      const { w, h } = sizeRef.current;
      const { x: mx, y: my } = mouseRef.current;

      ctx.clearRect(0, 0, w, h);

      // Draw cached base dots
      if (baseCacheRef.current) {
        ctx.drawImage(baseCacheRef.current, 0, 0, w, h);
      }

      // Only draw glow dots near cursor
      const glowR2 = GLOW_RADIUS * GLOW_RADIUS;
      if (mx > -500 && my > -500) {
        const minCol = Math.max(0, Math.floor((mx - GLOW_RADIUS) / DOT_SPACING));
        const maxCol = Math.ceil((mx + GLOW_RADIUS) / DOT_SPACING);
        const minRow = Math.max(0, Math.floor((my - GLOW_RADIUS) / DOT_SPACING));
        const maxRow = Math.ceil((my + GLOW_RADIUS) / DOT_SPACING);

        for (let row = minRow; row <= maxRow; row++) {
          const y = row * DOT_SPACING;
          const dy = y - my;
          const dy2 = dy * dy;
          if (dy2 > glowR2) continue;

          for (let col = minCol; col <= maxCol; col++) {
            const x = col * DOT_SPACING;
            const dx = x - mx;
            const dist2 = dx * dx + dy2;
            if (dist2 >= glowR2) continue;

            const t = 1 - Math.sqrt(dist2) / GLOW_RADIUS;
            // Steep cubic falloff — outer dots barely differ from base,
            // only dots close to cursor get noticeably brighter
            const ease = t * t * t;
            if (ease < 0.01) continue; // skip imperceptible changes

            const radius = BASE_RADIUS + (MAX_RADIUS - BASE_RADIUS) * ease;
            const alpha = BASE_ALPHA + (MAX_ALPHA - BASE_ALPHA) * ease;
            const r = Math.round(255 + (DOT_COLOR.r - 255) * ease);
            const g = Math.round(255 + (DOT_COLOR.g - 255) * ease);
            const b = Math.round(255 + (DOT_COLOR.b - 255) * ease);

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.fill();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      needsDrawRef.current = true;
    };

    const onLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
      needsDrawRef.current = true;
    };

    resize();

    // Build base dot cache then start render loop
    const bmpPromise = drawBase();
    if (bmpPromise) {
      bmpPromise.then((bmp) => {
        baseCacheRef.current = bmp;
        needsDrawRef.current = true;
      });
    }
    rafRef.current = requestAnimationFrame(draw);

    parent.addEventListener('mousemove', onMouse);
    parent.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      parent.removeEventListener('mousemove', onMouse);
      parent.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
