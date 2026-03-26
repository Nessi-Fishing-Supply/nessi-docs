'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSyncExternalStore } from 'react';

const ZOOM_FACTOR = 1.12;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 20;
const LEFT_PADDING_SVG = 60;
const INITIAL_ZOOM = 1.25;

// Smoothing parameters
const LERP_SPEED = 0.22; // 0 = no movement, 1 = instant (higher = snappier)
const SNAP_THRESHOLD = 0.001; // stop animating when close enough
const VELOCITY_FRICTION = 0.85; // momentum decay per frame (lower = stops faster)
const VELOCITY_MIN = 0.5; // stop momentum below this speed (SVG units/frame)

interface PanZoomState {
  zoom: number;
  vx: number;
  vy: number;
  vbW: number;
  vbH: number;
}

// ─── External store (rendered state) ───
let state: PanZoomState = { zoom: INITIAL_ZOOM, vx: 0, vy: 0, vbW: 640, vbH: 480 };
const listeners = new Set<() => void>();
const savedViews = new Map<string, PanZoomState>();

function getSnapshot() {
  return state;
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function emit(next: PanZoomState) {
  state = next;
  listeners.forEach((cb) => cb());
}

// ─── Target state (where we're animating toward) ───
let target = { zoom: INITIAL_ZOOM, vx: 0, vy: 0 };
let animating = false;
let rafId = 0;

// Pan momentum
let velocity = { vx: 0, vy: 0 };
let hasMomentum = false;

function getContainerSize(el: HTMLElement | null) {
  if (!el) return { w: 800, h: 600 };
  const r = el.getBoundingClientRect();
  return { w: r.width || 800, h: r.height || 600 };
}

function startAnimation(wrapperEl: HTMLElement | null) {
  if (animating) return;
  animating = true;

  const tick = () => {
    const c = getContainerSize(wrapperEl);

    // Apply momentum if active
    if (hasMomentum) {
      const speed = Math.abs(velocity.vx) + Math.abs(velocity.vy);
      if (speed > VELOCITY_MIN) {
        target.vx += velocity.vx;
        target.vy += velocity.vy;
        velocity.vx *= VELOCITY_FRICTION;
        velocity.vy *= VELOCITY_FRICTION;
      } else {
        hasMomentum = false;
        velocity.vx = 0;
        velocity.vy = 0;
      }
    }

    // Lerp current toward target
    const dz = target.zoom - state.zoom;
    const dx = target.vx - state.vx;
    const dy = target.vy - state.vy;

    const close =
      Math.abs(dz) < SNAP_THRESHOLD * state.zoom &&
      Math.abs(dx) < SNAP_THRESHOLD &&
      Math.abs(dy) < SNAP_THRESHOLD &&
      !hasMomentum;

    if (close) {
      // Snap to target and stop
      emit({
        zoom: target.zoom,
        vx: target.vx,
        vy: target.vy,
        vbW: c.w / target.zoom,
        vbH: c.h / target.zoom,
      });
      animating = false;
      return;
    }

    const newZoom = state.zoom + dz * LERP_SPEED;
    const newVx = state.vx + dx * LERP_SPEED;
    const newVy = state.vy + dy * LERP_SPEED;

    emit({
      zoom: newZoom,
      vx: newVx,
      vy: newVy,
      vbW: c.w / newZoom,
      vbH: c.h / newZoom,
    });

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
}

export function usePanZoom(
  baseViewBox: { minX: number; minY: number; width: number; height: number },
  viewKey?: string,
) {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const currentKey = useRef<string | undefined>(undefined);
  const initialized = useRef(false);

  const getContainer = useCallback(() => getContainerSize(wrapperRef.current), []);

  const kick = useCallback(() => startAnimation(wrapperRef.current), []);

  const buildTarget = useCallback(
    (zoom: number, vx: number, vy: number) => {
      target = { zoom, vx, vy };
      kick();
    },
    [kick],
  );

  // Instantly set state (no animation) for view restore / init
  const setImmediate = useCallback(
    (zoom: number, vx: number, vy: number) => {
      const c = getContainer();
      const s = { zoom, vx, vy, vbW: c.w / zoom, vbH: c.h / zoom };
      target = { zoom, vx, vy };
      emit(s);
    },
    [getContainer],
  );

  const saveCurrentView = useCallback(() => {
    if (currentKey.current) savedViews.set(currentKey.current, { ...state });
  }, []);

  const computeInitialView = useCallback((): PanZoomState => {
    const c = getContainer();
    const vbH = c.h / INITIAL_ZOOM;
    const centerY = baseViewBox.minY + baseViewBox.height / 2;
    return {
      zoom: INITIAL_ZOOM,
      vx: baseViewBox.minX - LEFT_PADDING_SVG,
      vy: centerY - vbH / 2,
      vbW: c.w / INITIAL_ZOOM,
      vbH,
    };
  }, [baseViewBox, getContainer]);

  // Handle view key changes
  const prevKey = useRef(viewKey);
  useEffect(() => {
    const keyChanged = prevKey.current !== viewKey;
    const firstMount = !initialized.current;

    if (keyChanged || firstMount) {
      if (keyChanged) saveCurrentView();
      prevKey.current = viewKey;
      currentKey.current = viewKey;
      initialized.current = true;

      const saved = viewKey ? savedViews.get(viewKey) : undefined;
      if (saved) {
        setImmediate(saved.zoom, saved.vx, saved.vy);
      } else {
        const iv = computeInitialView();
        setImmediate(iv.zoom, iv.vx, iv.vy);
        requestAnimationFrame(() => {
          const iv2 = computeInitialView();
          setImmediate(iv2.zoom, iv2.vx, iv2.vy);
        });
      }
    }
  }, [viewKey, saveCurrentView, computeInitialView, setImmediate]);

  useEffect(() => {
    return () => {
      if (currentKey.current) savedViews.set(currentKey.current, { ...state });
      cancelAnimationFrame(rafId);
      animating = false;
    };
  }, []);

  const vb = { x: s.vx, y: s.vy, w: s.vbW, h: s.vbH };

  const zoomIn = useCallback(() => {
    const nz = Math.min(target.zoom * ZOOM_FACTOR, MAX_ZOOM);
    buildTarget(nz, target.vx, target.vy);
  }, [buildTarget]);

  const zoomOut = useCallback(() => {
    const nz = Math.max(target.zoom / ZOOM_FACTOR, MIN_ZOOM);
    buildTarget(nz, target.vx, target.vy);
  }, [buildTarget]);

  const resetView = useCallback(() => {
    const iv = computeInitialView();
    hasMomentum = false;
    velocity = { vx: 0, vy: 0 };
    buildTarget(iv.zoom, iv.vx, iv.vy);
    if (currentKey.current) savedViews.delete(currentKey.current);
  }, [computeInitialView, buildTarget]);

  const panTo = useCallback(
    (svgCenterX: number, svgCenterY: number) => {
      const c = getContainer();
      const z = target.zoom;
      hasMomentum = false;
      buildTarget(z, svgCenterX - c.w / z / 2, svgCenterY - c.h / z / 2);
    },
    [getContainer, buildTarget],
  );

  const handlers = {
    onMouseDown: useCallback((e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isPanning.current = true;
      hasMomentum = false;
      velocity = { vx: 0, vy: 0 };
      lastMouse.current = { x: e.clientX, y: e.clientY };
      lastTime.current = performance.now();
    }, []),

    onMouseMove: useCallback(
      (e: React.MouseEvent) => {
        if (!isPanning.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        const now = performance.now();
        const dt = Math.max(1, now - lastTime.current);

        // Track velocity for momentum (in SVG units per frame at 60fps)
        const z = state.zoom;
        velocity.vx = (-dx / z) * (16.67 / dt);
        velocity.vy = (-dy / z) * (16.67 / dt);

        lastMouse.current = { x: e.clientX, y: e.clientY };
        lastTime.current = now;

        // Direct tracking while dragging (no lerp — feels most responsive)
        target.vx -= dx / z;
        target.vy -= dy / z;
        kick();
      },
      [kick],
    ),

    onMouseUp: useCallback(() => {
      if (!isPanning.current) return;
      isPanning.current = false;
      // Enable momentum coasting
      const speed = Math.abs(velocity.vx) + Math.abs(velocity.vy);
      if (speed > VELOCITY_MIN) {
        hasMomentum = true;
        kick();
      }
    }, [kick]),

    onMouseLeave: useCallback(() => {
      if (!isPanning.current) return;
      isPanning.current = false;
      const speed = Math.abs(velocity.vx) + Math.abs(velocity.vy);
      if (speed > VELOCITY_MIN) {
        hasMomentum = true;
        kick();
      }
    }, [kick]),

    onWheel: useCallback(
      (e: React.WheelEvent) => {
        e.preventDefault();
        const el = wrapperRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const z = target.zoom;
        const fx = (e.clientX - rect.left) / rect.width;
        const fy = (e.clientY - rect.top) / rect.height;
        const oldW = rect.width / z;
        const oldH = rect.height / z;
        const dir = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * dir));
        const newW = rect.width / nz;
        const newH = rect.height / nz;

        target.zoom = nz;
        target.vx = target.vx + (oldW - newW) * fx;
        target.vy = target.vy + (oldH - newH) * fy;
        kick();
      },
      [kick],
    ),
  };

  return {
    zoom: Math.round((s.zoom / INITIAL_ZOOM) * 100),
    viewBoxString: `${vb.x} ${vb.y} ${vb.w} ${vb.h}`,
    zoomIn,
    zoomOut,
    resetView,
    panTo,
    handlers,
    wrapperRef,
  };
}
