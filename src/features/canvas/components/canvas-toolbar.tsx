'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { StepLayer, StepStatus } from '@/types/journey';
import { LAYER_CONFIG, STATUS_CONFIG } from '@/types/journey';
import { hexToRgba } from '@/features/canvas/utils/geometry';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ZoomControls {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

interface FilterControls {
  visibleLayers: Set<string>;
  visibleStatuses: Set<string>;
  onToggleLayer: (layer: StepLayer) => void;
  onToggleStatus: (status: StepStatus) => void;
}

interface PathControls {
  hasPath: boolean;
  resetPath: () => void;
}

interface CanvasToolbarProps {
  zoomControls: ZoomControls;
  minimapVisible: boolean;
  onToggleMinimap: () => void;
  filterControls?: FilterControls;
  pathControls?: PathControls;
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (16x16 viewBox)                                   */
/* ------------------------------------------------------------------ */

function MinimapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line
        x1="4"
        y1="8"
        x2="12"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line
        x1="4"
        y1="8"
        x2="12"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="4"
        x2="8"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FitViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 6V3a1 1 0 011-1h3M10 2h3a1 1 0 011 1v3M14 10v3a1 1 0 01-1 1h-3M6 14H3a1 1 0 01-1-1v-3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 4h12M4 8h8M6 12h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line
        x1="4"
        y1="4"
        x2="12"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="4"
        x2="4"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles (inline to match spec exactly)                              */
/* ------------------------------------------------------------------ */

const TOOLBAR_STYLE: React.CSSProperties = {
  position: 'absolute',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  height: 40,
  padding: '0 4px',
  background: 'rgba(15,19,25,0.9)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  backdropFilter: 'blur(12px)',
};

const BTN_STYLE: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  borderRadius: 6,
  color: '#9a9790',
  cursor: 'pointer',
  padding: 0,
  flexShrink: 0,
};

const BTN_HOVER_BG = 'rgba(255,255,255,0.06)';
const BTN_ACTIVE_BG = 'rgba(61,140,117,0.15)';

const SEP_STYLE: React.CSSProperties = {
  width: 1,
  height: 16,
  background: 'rgba(255,255,255,0.08)',
  flexShrink: 0,
  margin: '0 2px',
};

const ZOOM_TEXT_STYLE: React.CSSProperties = {
  ...BTN_STYLE,
  width: 'auto',
  minWidth: 40,
  fontSize: 10,
  fontFamily: 'monospace',
  color: '#9a9790',
  userSelect: 'none',
};

/* ------------------------------------------------------------------ */
/*  Filters Dropup                                                     */
/* ------------------------------------------------------------------ */

function FiltersDropup({ controls }: { controls: FilterControls }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 48,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15,19,25,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        backdropFilter: 'blur(12px)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 11,
        minWidth: 200,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 9,
            color: '#6a6860',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginRight: 4,
          }}
        >
          Layers
        </span>
        {(Object.entries(LAYER_CONFIG) as [StepLayer, (typeof LAYER_CONFIG)[StepLayer]][]).map(
          ([key, cfg]) => {
            const active = controls.visibleLayers.has(key);
            return (
              <button
                key={key}
                onClick={() => controls.onToggleLayer(key)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: 10,
                  border: active ? `1px solid ${cfg.color}` : '1px solid transparent',
                  background: hexToRgba(cfg.color, active ? 0.15 : 0.05),
                  color: active ? cfg.color : '#9a9790',
                  opacity: active ? 1 : 0.5,
                  cursor: 'pointer',
                }}
              >
                {cfg.label}
              </button>
            );
          },
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 9,
            color: '#6a6860',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginRight: 4,
          }}
        >
          Status
        </span>
        {(Object.entries(STATUS_CONFIG) as [StepStatus, (typeof STATUS_CONFIG)[StepStatus]][]).map(
          ([key, cfg]) => {
            const active = controls.visibleStatuses.has(key);
            return (
              <button
                key={key}
                onClick={() => controls.onToggleStatus(key)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: 10,
                  border: active ? `1px solid ${cfg.color}` : '1px solid transparent',
                  background: hexToRgba(cfg.color, active ? 0.15 : 0.05),
                  color: active ? cfg.color : '#9a9790',
                  opacity: active ? 1 : 0.5,
                  cursor: 'pointer',
                }}
              >
                {cfg.label}
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toolbar button with hover/active styling                           */
/* ------------------------------------------------------------------ */

function ToolbarBtn({
  label,
  isActive,
  onClick,
  children,
  style: extraStyle,
}: {
  label: string;
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);

  const bg = isActive ? BTN_ACTIVE_BG : hovered ? BTN_HOVER_BG : 'none';

  return (
    <button
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...BTN_STYLE, background: bg, ...extraStyle }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Canvas Toolbar                                                     */
/* ------------------------------------------------------------------ */

export function CanvasToolbar({
  zoomControls,
  minimapVisible,
  onToggleMinimap,
  filterControls,
  pathControls,
}: CanvasToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dropupRef = useRef<HTMLDivElement>(null);

  // Close dropup on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropupRef.current && !dropupRef.current.contains(e.target as Node)) {
      setFiltersOpen(false);
    }
  }, []);

  useEffect(() => {
    if (filtersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [filtersOpen, handleClickOutside]);

  return (
    <div
      ref={dropupRef}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Filters dropup */}
      {filtersOpen && filterControls && (
        <div style={{ pointerEvents: 'auto' }}>
          <FiltersDropup controls={filterControls} />
        </div>
      )}

      {/* Toolbar */}
      <div style={{ ...TOOLBAR_STYLE, pointerEvents: 'auto' }}>
        {/* Minimap toggle */}
        <ToolbarBtn label="Toggle minimap" isActive={minimapVisible} onClick={onToggleMinimap}>
          <MinimapIcon />
        </ToolbarBtn>

        {/* Separator */}
        <div style={SEP_STYLE} />

        {/* Zoom out */}
        <ToolbarBtn label="Zoom out" onClick={zoomControls.zoomOut}>
          <ZoomOutIcon />
        </ToolbarBtn>

        {/* Zoom percentage — click to reset */}
        <ToolbarBtn
          label="Reset zoom to 100%"
          onClick={zoomControls.resetView}
          style={ZOOM_TEXT_STYLE}
        >
          {zoomControls.zoom}%
        </ToolbarBtn>

        {/* Zoom in */}
        <ToolbarBtn label="Zoom in" onClick={zoomControls.zoomIn}>
          <ZoomInIcon />
        </ToolbarBtn>

        {/* Separator */}
        <div style={SEP_STYLE} />

        {/* Fit to view */}
        <ToolbarBtn label="Fit to view" onClick={zoomControls.resetView}>
          <FitViewIcon />
        </ToolbarBtn>

        {/* Filters (journey-specific) */}
        {filterControls && (
          <>
            <div style={SEP_STYLE} />
            <ToolbarBtn
              label="Toggle filters"
              isActive={filtersOpen}
              onClick={() => setFiltersOpen((p) => !p)}
            >
              <FilterIcon />
            </ToolbarBtn>
          </>
        )}

        {/* Clear path (journey-specific, only when path active) */}
        {pathControls?.hasPath && (
          <>
            <div style={SEP_STYLE} />
            <ToolbarBtn label="Clear path trace" onClick={pathControls.resetPath}>
              <ClearIcon />
            </ToolbarBtn>
          </>
        )}
      </div>
    </div>
  );
}
