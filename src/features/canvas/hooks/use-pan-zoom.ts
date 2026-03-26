'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSyncExternalStore } from 'react';

const ZOOM_FACTOR = 1.12;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 20;
const LEFT_PADDING_SVG = 60;
const INITIAL_ZOOM = 1.25;

interface PanZoomState {
  zoom: number;
  vx: number;
  vy: number;
  // Cached viewport dimensions in SVG units (computed from container size / zoom)
  vbW: number;
  vbH: number;
}

let state: PanZoomState = { zoom: INITIAL_ZOOM, vx: 0, vy: 0, vbW: 640, vbH: 480 };
const listeners = new Set<() => void>();
const savedViews = new Map<string, PanZoomState>();

function getSnapshot() { return state; }
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function emit(next: PanZoomState) { state = next; listeners.forEach((cb) => cb()); }

export function usePanZoom(
  baseViewBox: { minX: number; minY: number; width: number; height: number },
  viewKey?: string,
) {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const currentKey = useRef<string | undefined>(undefined);
  const initialized = useRef(false);

  // Helper: get container pixel dimensions
  const getContainer = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return { w: 800, h: 600 };
    const r = el.getBoundingClientRect();
    return { w: r.width || 800, h: r.height || 600 };
  }, []);

  // Helper: build full state with viewport dimensions
  const buildState = useCallback((zoom: number, vx: number, vy: number): PanZoomState => {
    const c = getContainer();
    return { zoom, vx, vy, vbW: c.w / zoom, vbH: c.h / zoom };
  }, [getContainer]);

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
        emit(saved);
      } else {
        emit(computeInitialView());
        requestAnimationFrame(() => emit(computeInitialView()));
      }
    }
  }, [viewKey, saveCurrentView, computeInitialView]);

  useEffect(() => {
    return () => { if (currentKey.current) savedViews.set(currentKey.current, { ...state }); };
  }, []);

  // Render-safe: vb comes from the store, no ref access
  const vb = { x: s.vx, y: s.vy, w: s.vbW, h: s.vbH };

  const zoomIn = useCallback(() => {
    const newZoom = Math.min(state.zoom * ZOOM_FACTOR, MAX_ZOOM);
    emit(buildState(newZoom, state.vx, state.vy));
  }, [buildState]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(state.zoom / ZOOM_FACTOR, MIN_ZOOM);
    emit(buildState(newZoom, state.vx, state.vy));
  }, [buildState]);

  const resetView = useCallback(() => {
    emit(computeInitialView());
    if (currentKey.current) savedViews.delete(currentKey.current);
  }, [computeInitialView]);

  const panTo = useCallback((svgCenterX: number, svgCenterY: number) => {
    const c = getContainer();
    const z = state.zoom;
    emit({ zoom: z, vx: svgCenterX - c.w / z / 2, vy: svgCenterY - c.h / z / 2, vbW: c.w / z, vbH: c.h / z });
  }, [getContainer]);

  const handlers = {
    onMouseDown: useCallback((e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }, []),

    onMouseMove: useCallback((e: React.MouseEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      const z = state.zoom;
      emit({ ...state, vx: state.vx - dx / z, vy: state.vy - dy / z });
    }, []),

    onMouseUp: useCallback(() => { isPanning.current = false; }, []),
    onMouseLeave: useCallback(() => { isPanning.current = false; }, []),

    onWheel: useCallback((e: React.WheelEvent) => {
      e.preventDefault();
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const z = state.zoom;
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;
      const oldW = rect.width / z;
      const oldH = rect.height / z;
      const dir = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
      const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * dir));
      const newW = rect.width / nz;
      const newH = rect.height / nz;
      emit({ zoom: nz, vx: state.vx + (oldW - newW) * fx, vy: state.vy + (oldH - newH) * fy, vbW: newW, vbH: newH });
    }, []),
  };

  return {
    zoom: Math.round((s.zoom / INITIAL_ZOOM) * 100),
    viewBoxString: `${vb.x} ${vb.y} ${vb.w} ${vb.h}`,
    zoomIn, zoomOut, resetView, panTo, handlers, wrapperRef,
  };
}
