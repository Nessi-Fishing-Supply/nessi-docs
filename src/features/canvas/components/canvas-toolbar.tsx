'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { StepLayer, StepStatus } from '@/types/journey';
import { LAYER_CONFIG, STATUS_CONFIG } from '@/types/journey';
import { hexToRgba } from '@/features/canvas/utils/geometry';
import {
  MinimapIcon,
  ZoomOutIcon,
  ZoomInIcon,
  FitViewIcon,
  FilterIcon,
  LegendIcon,
  ResetIcon,
  ClearIcon,
} from '../icons/toolbar-icons';

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

interface CategoryItem {
  key: string;
  label: string;
  color: string;
}

interface CategoryControls {
  categories: CategoryItem[];
  visibleCategories: Set<string>;
  onToggleCategory: (key: string) => void;
}

interface ResetControls {
  isDirty: boolean;
  onReset: () => void;
}

interface CanvasToolbarProps {
  zoomControls: ZoomControls;
  minimapVisible: boolean;
  onToggleMinimap: () => void;
  legendVisible?: boolean;
  onToggleLegend?: () => void;
  filterControls?: FilterControls;
  categoryControls?: CategoryControls;
  pathControls?: PathControls;
  resetControls?: ResetControls;
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
        bottom: 70,
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
/*  Category Filters Dropup (ERD / generic)                            */
/* ------------------------------------------------------------------ */

function CategoryDropup({ controls }: { controls: CategoryControls }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 70,
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
          Category
        </span>
        {controls.categories.map((cat) => {
          const active = controls.visibleCategories.has(cat.key);
          return (
            <button
              key={cat.key}
              onClick={() => controls.onToggleCategory(cat.key)}
              style={{
                padding: '3px 10px',
                borderRadius: 12,
                fontSize: 10,
                border: active ? `1px solid ${cat.color}` : '1px solid transparent',
                background: hexToRgba(cat.color, active ? 0.15 : 0.05),
                color: active ? cat.color : '#9a9790',
                opacity: active ? 1 : 0.5,
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          );
        })}
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
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        aria-label={label}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ ...BTN_STYLE, background: bg, ...extraStyle }}
      >
        {children}
      </button>
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            pointerEvents: 'none',
            animation: 'tooltip-in 120ms ease-out',
          }}
        >
          <div
            style={{
              position: 'relative',
              whiteSpace: 'nowrap',
              padding: '4px 10px',
              background: 'rgba(15,19,25,0.97)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              fontSize: 10,
              color: '#b0ada8',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            {label}
            <svg
              width="14"
              height="7"
              viewBox="0 0 14 7"
              style={{
                position: 'absolute',
                bottom: -7,
                left: '50%',
                marginLeft: -7,
                display: 'block',
              }}
            >
              <path
                d="M0,0 L6,6 Q7,7 8,6 L14,0"
                fill="rgba(15,19,25,0.97)"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              <rect x="0" y="0" width="14" height="1" fill="rgba(15,19,25,0.97)" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Canvas Toolbar                                                     */
/* ------------------------------------------------------------------ */

export function CanvasToolbar({
  zoomControls,
  minimapVisible,
  onToggleMinimap,
  legendVisible,
  onToggleLegend,
  filterControls,
  categoryControls,
  pathControls,
  resetControls,
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
      {filtersOpen && !filterControls && categoryControls && (
        <div style={{ pointerEvents: 'auto' }}>
          <CategoryDropup controls={categoryControls} />
        </div>
      )}

      {/* Toolbar */}
      <div style={{ ...TOOLBAR_STYLE, pointerEvents: 'auto' }}>
        {/* Minimap toggle */}
        <ToolbarBtn label="Minimap" isActive={minimapVisible} onClick={onToggleMinimap}>
          <MinimapIcon />
        </ToolbarBtn>

        {/* Legend toggle */}
        {onToggleLegend && (
          <ToolbarBtn
            label="Legend"
            isActive={legendVisible}
            onClick={() => {
              onToggleLegend();
              setFiltersOpen(false);
            }}
          >
            <LegendIcon />
          </ToolbarBtn>
        )}

        {/* Separator */}
        <div style={SEP_STYLE} />

        {/* Zoom out */}
        <ToolbarBtn label="Zoom out" onClick={zoomControls.zoomOut}>
          <ZoomOutIcon />
        </ToolbarBtn>

        {/* Zoom percentage — click to reset */}
        <ToolbarBtn label="Reset Zoom" onClick={zoomControls.resetView} style={ZOOM_TEXT_STYLE}>
          {zoomControls.zoom}%
        </ToolbarBtn>

        {/* Zoom in */}
        <ToolbarBtn label="Zoom in" onClick={zoomControls.zoomIn}>
          <ZoomInIcon />
        </ToolbarBtn>

        {/* Separator */}
        <div style={SEP_STYLE} />

        {/* Fit to view */}
        <ToolbarBtn label="Recenter Canvas" onClick={zoomControls.resetView}>
          <FitViewIcon />
        </ToolbarBtn>

        {/* Filters */}
        {(filterControls || categoryControls) && (
          <>
            <div style={SEP_STYLE} />
            <ToolbarBtn
              label="Filter Nodes"
              isActive={filtersOpen}
              onClick={() => setFiltersOpen((p) => !p)}
            >
              <FilterIcon />
            </ToolbarBtn>
          </>
        )}

        {/* Clear path (only when path/trace active) */}
        {pathControls?.hasPath && (
          <>
            <div style={SEP_STYLE} />
            <ToolbarBtn label="Exit Trace Mode" onClick={pathControls.resetPath}>
              <ClearIcon />
            </ToolbarBtn>
          </>
        )}

        {/* Reset all (filters + trace) */}
        {resetControls?.isDirty && (
          <>
            <div style={SEP_STYLE} />
            <ToolbarBtn label="Reset All" onClick={resetControls.onReset}>
              <ResetIcon />
            </ToolbarBtn>
          </>
        )}
      </div>
    </div>
  );
}
