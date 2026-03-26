'use client';

import { type ReactNode } from 'react';
import { usePanZoom } from '../hooks/use-pan-zoom';
import { DotGrid } from '../components/dot-grid';
import styles from './canvas-provider.module.scss';

interface ZoomControls {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

interface CanvasProviderProps {
  viewBox: { minX: number; minY: number; width: number; height: number };
  viewKey?: string;
  children: ReactNode;
  overlay?: ReactNode;
  renderMinimap?: (viewBoxString: string, panTo: (x: number, y: number) => void) => ReactNode;
  renderToolbar?: (zoomControls: ZoomControls) => ReactNode;
}

export function CanvasProvider({ viewBox, viewKey, children, overlay, renderMinimap, renderToolbar }: CanvasProviderProps) {
  const { zoom, viewBoxString, zoomIn, zoomOut, resetView, panTo, handlers, wrapperRef } =
    usePanZoom(viewBox, viewKey);

  return (
    <div className={styles.wrapper} ref={wrapperRef} {...handlers}>
      <DotGrid />

      <svg
        className={styles.svg}
        viewBox={viewBoxString}
        preserveAspectRatio="xMinYMid meet"
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="rgba(61,140,117,0.5)" />
          </marker>
          <marker id="arrow-lit" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="rgba(61,140,117,0.8)" />
          </marker>
          <marker id="arrow-decision" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="rgba(232,144,72,0.5)" />
          </marker>
        </defs>
        {children}
      </svg>

      {overlay}

      {renderMinimap && renderMinimap(viewBoxString, panTo)}

      {renderToolbar && renderToolbar({ zoom, zoomIn, zoomOut, resetView })}
    </div>
  );
}
