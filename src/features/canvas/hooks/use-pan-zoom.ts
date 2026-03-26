'use client';

import { useCallback, useRef } from 'react';
import { useSyncExternalStore } from 'react';

/**
 * ViewBox-based pan/zoom — adjusts the SVG viewBox instead of CSS transforms.
 * This keeps SVG content vector-crisp at any zoom level (no bitmap scaling).
 */

const ZOOM_FACTOR = 1.06;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 6;

interface PanZoomState {
  zoom: number;
  // viewBox offset in SVG coordinates
  vx: number;
  vy: number;
}

// External store for zero-lag updates (no React setState in hot path)
let state: PanZoomState = { zoom: 1, vx: 0, vy: 0 };
let listeners = new Set<() => void>();

function getState() {
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

export function usePanZoom(baseViewBox: { minX: number; minY: number; width: number; height: number }) {
  const s = useSyncExternalStore(subscribe, getState, getState);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Reset state when baseViewBox changes (new journey)
  const prevBase = useRef(baseViewBox);
  if (prevBase.current !== baseViewBox) {
    prevBase.current = baseViewBox;
    emit({ zoom: 1, vx: baseViewBox.minX, vy: baseViewBox.minY });
  }

  // Compute the actual viewBox from zoom + pan
  const getViewBox = useCallback(() => {
    const w = baseViewBox.width / s.zoom;
    const h = baseViewBox.height / s.zoom;
    return { x: s.vx, y: s.vy, w, h };
  }, [s.vx, s.vy, s.zoom, baseViewBox.width, baseViewBox.height]);

  const vb = getViewBox();

  // Convert screen px to SVG coordinate delta
  const screenToSvgDelta = useCallback((dxPx: number, dyPx: number) => {
    const el = wrapperRef.current;
    if (!el) return { dx: 0, dy: 0 };
    const rect = el.getBoundingClientRect();
    const currentVb = getViewBox();
    return {
      dx: (dxPx / rect.width) * currentVb.w,
      dy: (dyPx / rect.height) * currentVb.h,
    };
  }, [getViewBox]);

  const zoomIn = useCallback(() => {
    emit({ ...state, zoom: Math.min(state.zoom * ZOOM_FACTOR, MAX_ZOOM) });
  }, []);

  const zoomOut = useCallback(() => {
    emit({ ...state, zoom: Math.max(state.zoom / ZOOM_FACTOR, MIN_ZOOM) });
  }, []);

  const resetView = useCallback(() => {
    emit({ zoom: 1, vx: baseViewBox.minX, vy: baseViewBox.minY });
  }, [baseViewBox.minX, baseViewBox.minY]);

  const panTo = useCallback(
    (svgCenterX: number, svgCenterY: number) => {
      const s = getState();
      const vbW = baseViewBox.width / s.zoom;
      const vbH = baseViewBox.height / s.zoom;
      emit({ ...s, vx: svgCenterX - vbW / 2, vy: svgCenterY - vbH / 2 });
    },
    [baseViewBox.width, baseViewBox.height],
  );

  const handlers = {
    onMouseDown: useCallback((e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }, []),

    onMouseMove: useCallback((e: React.MouseEvent) => {
      if (!isPanning.current) return;
      const dxPx = e.clientX - lastMouse.current.x;
      const dyPx = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = getState();
      const vbW = baseViewBox.width / s.zoom;
      const vbH = baseViewBox.height / s.zoom;

      // Pan: move viewBox opposite to mouse direction
      emit({
        ...s,
        vx: s.vx - (dxPx / rect.width) * vbW,
        vy: s.vy - (dyPx / rect.height) * vbH,
      });
    }, [baseViewBox.width, baseViewBox.height]),

    onMouseUp: useCallback(() => {
      isPanning.current = false;
    }, []),

    onMouseLeave: useCallback(() => {
      isPanning.current = false;
    }, []),

    onWheel: useCallback((e: React.WheelEvent) => {
      e.preventDefault();
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const s = getState();

      // Cursor position as fraction of the wrapper
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;

      const oldW = baseViewBox.width / s.zoom;
      const oldH = baseViewBox.height / s.zoom;

      const direction = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, s.zoom * direction));

      const newW = baseViewBox.width / newZoom;
      const newH = baseViewBox.height / newZoom;

      // Adjust origin so the point under cursor stays fixed
      emit({
        zoom: newZoom,
        vx: s.vx + (oldW - newW) * fx,
        vy: s.vy + (oldH - newH) * fy,
      });
    }, [baseViewBox.width, baseViewBox.height]),
  };

  return {
    zoom: s.zoom,
    viewBoxString: `${vb.x} ${vb.y} ${vb.w} ${vb.h}`,
    zoomIn,
    zoomOut,
    resetView,
    panTo,
    handlers,
    wrapperRef,
  };
}
