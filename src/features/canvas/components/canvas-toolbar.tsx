'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { StepLayer, StepStatus } from '@/features/journeys';
import { ToolbarBtn } from './toolbar-button';
import { FiltersDropup } from './filters-dropup';
import { CategoryDropup } from './category-dropup';
import type { CategoryItem } from './category-dropup';
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
/*  Styles                                                             */
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
  maxWidth: 'calc(100% - 32px)',
  overflowX: 'auto',
};

const SEP_STYLE: React.CSSProperties = {
  width: 1,
  height: 16,
  background: 'rgba(255,255,255,0.08)',
  flexShrink: 0,
  margin: '0 2px',
};

const ZOOM_TEXT_STYLE: React.CSSProperties = {
  width: 'auto',
  minWidth: 40,
  fontSize: 10,
  fontFamily: 'monospace',
  color: '#9a9790',
  userSelect: 'none',
};

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
