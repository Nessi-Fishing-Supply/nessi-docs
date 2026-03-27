'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import type { Lifecycle, LifecycleTransition } from '@/types/lifecycle';
import { CanvasProvider } from '@/features/canvas/canvas-provider';
import { StateNode } from '@/features/canvas/components/state-node';
import { StateTooltip } from '@/features/canvas/components/state-tooltip';
import { LabelPill } from '@/features/canvas/components/label-pill';
import { CanvasToolbar } from '@/features/canvas/components/canvas-toolbar';
import { LifecycleLegend } from '@/features/canvas/components/lifecycle-legend';
import {
  LIFECYCLE_NODE_WIDTH,
  LIFECYCLE_NODE_HEIGHT,
  smoothPath,
  type PortSide,
} from '@/features/canvas/utils/geometry';

interface LifecycleCanvasProps {
  lifecycle: Lifecycle;
}

const SIDE_TO_DIRS: Record<string, [PortSide, PortSide]> = {
  'r-l': ['right', 'left'],
  'b-t': ['bottom', 'top'],
  't-b': ['top', 'bottom'],
  'b-l': ['bottom', 'left'],
};

function getTransitionPath(
  t: LifecycleTransition,
  stateMap: Map<string, { x: number; y: number }>,
) {
  if (t.fx !== undefined && t.fy !== undefined && t.tx !== undefined && t.ty !== undefined) {
    const [fDir, tDir] = SIDE_TO_DIRS[t.side ?? 'r-l'] ?? (['right', 'left'] as const);
    return {
      d: smoothPath(t.fx, t.fy, fDir, t.tx, t.ty, tDir),
      mx: (t.fx + t.tx) / 2,
      my: (t.fy + t.ty) / 2,
    };
  }

  const from = stateMap.get(t.from);
  const to = stateMap.get(t.to);
  if (!from || !to) return null;

  let fx: number, fy: number, tx: number, ty: number;
  let fDir: PortSide, tDir: PortSide;

  if (t.side === 'b-t') {
    fx = from.x + LIFECYCLE_NODE_WIDTH / 2;
    fy = from.y + LIFECYCLE_NODE_HEIGHT;
    tx = to.x + LIFECYCLE_NODE_WIDTH / 2;
    ty = to.y;
    fDir = 'bottom';
    tDir = 'top';
  } else if (t.side === 't-b') {
    fx = from.x + LIFECYCLE_NODE_WIDTH / 2;
    fy = from.y;
    tx = to.x + LIFECYCLE_NODE_WIDTH / 2;
    ty = to.y + LIFECYCLE_NODE_HEIGHT;
    fDir = 'top';
    tDir = 'bottom';
  } else if (t.side === 'b-l') {
    fx = from.x + LIFECYCLE_NODE_WIDTH / 2;
    fy = from.y + LIFECYCLE_NODE_HEIGHT;
    tx = to.x;
    ty = to.y + LIFECYCLE_NODE_HEIGHT / 2;
    fDir = 'bottom';
    tDir = 'left';
  } else {
    // Auto-detect best exit/entry side based on relative position
    const fromCx = from.x + LIFECYCLE_NODE_WIDTH / 2;
    const fromCy = from.y + LIFECYCLE_NODE_HEIGHT / 2;
    const toCx = to.x + LIFECYCLE_NODE_WIDTH / 2;
    const toCy = to.y + LIFECYCLE_NODE_HEIGHT / 2;
    const dx = toCx - fromCx;
    const dy = toCy - fromCy;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal dominant
      fy = from.y + LIFECYCLE_NODE_HEIGHT / 2;
      ty = to.y + LIFECYCLE_NODE_HEIGHT / 2;
      if (dx > 0) {
        fx = from.x + LIFECYCLE_NODE_WIDTH;
        tx = to.x;
        fDir = 'right';
        tDir = 'left';
      } else {
        fx = from.x;
        tx = to.x + LIFECYCLE_NODE_WIDTH;
        fDir = 'left';
        tDir = 'right';
      }
    } else {
      // Vertical dominant
      fx = from.x + LIFECYCLE_NODE_WIDTH / 2;
      tx = to.x + LIFECYCLE_NODE_WIDTH / 2;
      if (dy > 0) {
        fy = from.y + LIFECYCLE_NODE_HEIGHT;
        ty = to.y;
        fDir = 'bottom';
        tDir = 'top';
      } else {
        fy = from.y;
        ty = to.y + LIFECYCLE_NODE_HEIGHT;
        fDir = 'top';
        tDir = 'bottom';
      }
    }
  }

  return { d: smoothPath(fx, fy, fDir, tx, ty, tDir), mx: (fx + tx) / 2, my: (fy + ty) / 2 };
}

/** Trace hook for lifecycle — click a state to isolate its connections */
function useLifecycleTrace(transitions: LifecycleTransition[]) {
  const [focusedStateId, setFocusedStateId] = useState<string | null>(null);

  const toggleFocus = useCallback((stateId: string) => {
    setFocusedStateId((prev) => (prev === stateId ? null : stateId));
  }, []);

  const resetTrace = useCallback(() => {
    setFocusedStateId(null);
  }, []);

  const { litNodes, litEdges } = useMemo(() => {
    if (!focusedStateId) {
      return { litNodes: new Set<string>(), litEdges: new Set<number>() };
    }

    const litN = new Set<string>([focusedStateId]);
    const litE = new Set<number>();

    for (let i = 0; i < transitions.length; i++) {
      const t = transitions[i];
      if (t.from === focusedStateId || t.to === focusedStateId) {
        litN.add(t.from);
        litN.add(t.to);
        litE.add(i);
      }
    }

    return { litNodes: litN, litEdges: litE };
  }, [focusedStateId, transitions]);

  const hasTrace = focusedStateId !== null;

  return { focusedStateId, toggleFocus, resetTrace, litNodes, litEdges, hasTrace };
}

export function LifecycleCanvas({ lifecycle }: LifecycleCanvasProps) {
  const [minimapVisible, setMinimapVisible] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toggleFocus, resetTrace, litNodes, litEdges, hasTrace } = useLifecycleTrace(
    lifecycle.transitions,
  );
  const stateMap = new Map(lifecycle.states.map((s) => [s.id, s]));

  // Compute viewBox from state positions
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const s of lifecycle.states) {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x + LIFECYCLE_NODE_WIDTH);
    maxY = Math.max(maxY, s.y + LIFECYCLE_NODE_HEIGHT);
  }
  const padding = 80;
  const viewBox = {
    minX: minX - padding,
    minY: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };

  return (
    <CanvasProvider
      viewBox={viewBox}
      viewKey={`lifecycle-${lifecycle.slug}`}
      legend={<LifecycleLegend visible={legendVisible} />}
      renderToolbar={(zoomControls) => (
        <CanvasToolbar
          zoomControls={zoomControls}
          minimapVisible={minimapVisible}
          onToggleMinimap={() => setMinimapVisible((p) => !p)}
          legendVisible={legendVisible}
          onToggleLegend={() => setLegendVisible((p) => !p)}
          pathControls={{
            hasPath: hasTrace,
            resetPath: resetTrace,
          }}
          resetControls={{
            isDirty: hasTrace,
            onReset: resetTrace,
          }}
        />
      )}
    >
      {/* Transition lines — rendered first (lowest z-layer) */}
      {lifecycle.transitions.map((t, i) => {
        const path = getTransitionPath(t, stateMap);
        if (!path) return null;

        const isLit = litEdges.has(i);
        const isDimmed = hasTrace && !isLit;

        return (
          <g key={i}>
            <path
              d={path.d}
              fill="none"
              stroke={isLit ? 'rgba(61,140,117,0.5)' : 'rgba(154,151,144,0.3)'}
              strokeWidth={isLit ? 2 : 1.5}
              markerEnd={isLit ? 'url(#arrow-lit)' : 'url(#arrow)'}
              style={{
                opacity: isDimmed ? 0.08 : 1,
                transition: 'opacity 400ms ease-out',
              }}
            />
            {/* Animated flow on lit edges */}
            {isLit && (
              <path
                d={path.d}
                fill="none"
                stroke="rgba(61,140,117,0.7)"
                strokeWidth={2.5}
                strokeDasharray="4 16"
                strokeLinecap="round"
                markerEnd="url(#arrow-lit)"
                style={{
                  animation: 'flow-pulse 1.8s linear infinite',
                  opacity: 0.85,
                }}
              />
            )}
          </g>
        );
      })}

      {/* Transition labels — rendered above all lines */}
      {lifecycle.transitions.map((t, i) => {
        const path = getTransitionPath(t, stateMap);
        if (!path) return null;

        const isLit = litEdges.has(i);
        const isDimmed = hasTrace && !isLit;

        return (
          <g key={i} style={{ opacity: isDimmed ? 0.1 : 1, transition: 'opacity 400ms ease-out' }}>
            <LabelPill x={path.mx} y={path.my} label={t.label} />
          </g>
        );
      })}

      {/* State nodes */}
      {lifecycle.states.map((state) => {
        const isLit = litNodes.has(state.id);
        const isDimmed = hasTrace && !isLit;

        return (
          <g
            key={state.id}
            style={{
              opacity: isDimmed ? 0.15 : 1,
              transition: 'opacity 400ms ease-out',
            }}
            onMouseEnter={() => {
              if (hoverTimer.current) clearTimeout(hoverTimer.current);
              if (!isDimmed) setHoveredStateId(state.id);
            }}
            onMouseLeave={() => {
              hoverTimer.current = setTimeout(() => setHoveredStateId(null), 120);
            }}
          >
            <StateNode
              state={state}
              isSelected={litNodes.has(state.id) && hasTrace}
              onClick={() => {
                toggleFocus(state.id);
              }}
            />
          </g>
        );
      })}

      {/* Tooltip — rendered last so it sits above all nodes */}
      {hoveredStateId &&
        (() => {
          const state = stateMap.get(hoveredStateId);
          if (!state) return null;
          return (
            <StateTooltip
              state={state}
              lifecycle={lifecycle}
              onMouseEnter={() => {
                if (hoverTimer.current) clearTimeout(hoverTimer.current);
              }}
              onMouseLeave={() => {
                hoverTimer.current = setTimeout(() => setHoveredStateId(null), 120);
              }}
            />
          );
        })()}
    </CanvasProvider>
  );
}
