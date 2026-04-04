'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import type { Lifecycle, LifecycleState, LifecycleTransition } from '../../types/lifecycle';
import type { DiffStatus } from '@/features/diff-overview/types/diff';
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
import { useCanvasKeyboardNav } from '@/features/canvas/hooks/use-canvas-keyboard-nav';
import { useAppStore } from '@/libs/app-store';
import { useDiffResult } from '@/features/diff-overview';
import { useDiffNodes } from '@/features/canvas/hooks/use-diff-nodes';

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

function getEdgeDiffStatus(
  fromId: string,
  toId: string,
  statusMap: Map<string, DiffStatus>,
): DiffStatus | null {
  if (statusMap.size === 0) return null;
  const fromStatus = statusMap.get(fromId);
  const toStatus = statusMap.get(toId);
  if (fromStatus === 'removed' || toStatus === 'removed') return 'removed';
  if (fromStatus === 'added' || toStatus === 'added') return 'added';
  if (fromStatus === 'modified' || toStatus === 'modified') return 'modified';
  return 'unchanged';
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
  const { focusedStateId, toggleFocus, resetTrace, litNodes, litEdges, hasTrace } =
    useLifecycleTrace(lifecycle.transitions);
  useCanvasKeyboardNav({
    nodes: lifecycle.states,
    selectedId: focusedStateId,
    onSelect: (id) => toggleFocus(id),
    onClear: resetTrace,
  });

  // Diff mode integration
  const { isActive: isDiffMode, compareBranch, diffResult } = useDiffResult();
  const activeBranch = useAppStore.use.activeBranch();
  const branches = useAppStore.use.branches();
  const activeBranchLabel = branches.find((b) => b.name === activeBranch)?.label ?? activeBranch;
  const compareBranchLabel =
    branches.find((b) => b.name === compareBranch)?.label ?? compareBranch ?? '';

  // Get base lifecycle for node-level comparison
  const baseLifecycle =
    isDiffMode && diffResult
      ? (() => {
          const mod = diffResult.lifecycles.modified.find((m) => m.base.slug === lifecycle.slug);
          if (mod) return mod.base;
          return null;
        })()
      : null;

  const getStateKey = useCallback((s: LifecycleState) => s.id, []);

  const {
    statusMap: nodeStatusMap,
    changesMap,
    ghostNodes: ghostStates,
  } = useDiffNodes(lifecycle.states, baseLifecycle?.states ?? null, getStateKey);

  // Diff transitions directly (more precise than deriving from node status)
  const transitionStatusMap = useMemo(() => {
    if (!baseLifecycle) return new Map<string, DiffStatus>();
    const baseTransitions = new Map(baseLifecycle.transitions.map((t) => [`${t.from}:${t.to}`, t]));
    const headTransitions = new Map(lifecycle.transitions.map((t) => [`${t.from}:${t.to}`, t]));
    const map = new Map<string, DiffStatus>();
    for (const [key, t] of headTransitions) {
      const base = baseTransitions.get(key);
      if (!base) {
        map.set(key, 'added');
      } else if (JSON.stringify(base) !== JSON.stringify(t)) {
        map.set(key, 'modified');
      } else {
        map.set(key, 'unchanged');
      }
    }
    for (const key of baseTransitions.keys()) {
      if (!headTransitions.has(key)) map.set(key, 'removed');
    }
    return map;
  }, [lifecycle.transitions, baseLifecycle]);

  const allStates = [...lifecycle.states, ...ghostStates];
  const stateMap = new Map(allStates.map((s) => [s.id, s]));

  // Compute viewBox from state positions
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const s of allStates) {
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
      legend={<LifecycleLegend visible={legendVisible} isDiffMode={isDiffMode} />}
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
        const edgeDiffStatus = isDiffMode
          ? (transitionStatusMap.get(`${t.from}:${t.to}`) ??
            getEdgeDiffStatus(t.from, t.to, nodeStatusMap))
          : null;

        let edgeStroke = isLit ? 'rgba(61,140,117,0.5)' : 'rgba(154,151,144,0.3)';
        let edgeOpacity = isDimmed ? 0.08 : 1;
        let edgeMarker = isLit ? 'url(#arrow-lit)' : 'url(#arrow)';
        let edgeDash: string | undefined = undefined;

        if (edgeDiffStatus) {
          if (edgeDiffStatus === 'added') {
            edgeStroke = 'rgba(61,140,117,0.85)';
            edgeMarker = 'url(#arrow-diff-added)';
            edgeOpacity = 1;
          } else if (edgeDiffStatus === 'modified') {
            edgeStroke = 'rgba(123,143,205,0.85)';
            edgeMarker = 'url(#arrow-diff-modified)';
            edgeOpacity = 1;
          } else if (edgeDiffStatus === 'removed') {
            edgeStroke = 'rgba(184,64,64,0.5)';
            edgeMarker = 'url(#arrow-diff-removed)';
            edgeDash = '3 5';
            edgeOpacity = 0.4;
          } else if (edgeDiffStatus === 'unchanged') {
            edgeOpacity = 0.08;
          }
        }

        return (
          <g key={i}>
            <path
              d={path.d}
              fill="none"
              stroke={edgeStroke}
              strokeWidth={isLit ? 2 : 1.5}
              strokeDasharray={edgeDash}
              markerEnd={edgeMarker}
              style={{
                opacity: edgeOpacity,
                transition: 'opacity 400ms ease-out',
              }}
            />
            {/* Animated flow on lit edges */}
            {isLit && edgeDiffStatus !== 'removed' && edgeDiffStatus !== 'unchanged' && (
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
        const edgeDiffStatus = isDiffMode
          ? (transitionStatusMap.get(`${t.from}:${t.to}`) ??
            getEdgeDiffStatus(t.from, t.to, nodeStatusMap))
          : null;

        const labelOpacity =
          edgeDiffStatus === 'unchanged'
            ? 0.15
            : edgeDiffStatus === 'removed'
              ? 0.4
              : isDimmed
                ? 0.1
                : 1;

        return (
          <g key={i} style={{ opacity: labelOpacity, transition: 'opacity 400ms ease-out' }}>
            <LabelPill x={path.mx} y={path.my} label={t.label} />
          </g>
        );
      })}

      {/* State nodes */}
      {lifecycle.states.map((state) => {
        const isLit = litNodes.has(state.id);
        const isDimmed = !isDiffMode && hasTrace && !isLit;
        const nodeDiffStatus = isDiffMode ? (nodeStatusMap.get(state.id) ?? null) : null;
        const isChangedNode = nodeDiffStatus === 'added' || nodeDiffStatus === 'modified';

        // In diff mode: only changed nodes get hover tooltips
        const canHover = isDiffMode ? isChangedNode : !isDimmed;

        return (
          <g
            key={state.id}
            style={{
              opacity: isDimmed ? 0.15 : 1,
              transition: 'opacity 400ms ease-out',
            }}
            onMouseEnter={() => {
              if (hoverTimer.current) clearTimeout(hoverTimer.current);
              if (canHover) setHoveredStateId(state.id);
            }}
            onMouseLeave={() => {
              hoverTimer.current = setTimeout(() => setHoveredStateId(null), 120);
            }}
          >
            <StateNode
              state={state}
              isSelected={!isDiffMode && litNodes.has(state.id) && hasTrace}
              diffStatus={nodeDiffStatus}
              onClick={isDiffMode ? undefined : () => toggleFocus(state.id)}
            />
          </g>
        );
      })}

      {/* Ghost nodes from base branch (removed states) */}
      {isDiffMode &&
        ghostStates.map((state) => (
          <g key={`ghost-${state.id}`}>
            <StateNode state={state} diffStatus="removed" />
          </g>
        ))}

      {/* Tooltip — rendered last so it sits above all nodes */}
      {hoveredStateId &&
        (() => {
          const state = stateMap.get(hoveredStateId);
          if (!state) return null;
          const tooltipDiffStatus = isDiffMode ? (nodeStatusMap.get(state.id) ?? null) : null;
          return (
            <StateTooltip
              state={state}
              lifecycle={lifecycle}
              diffStatus={tooltipDiffStatus}
              diffChanges={isDiffMode ? changesMap.get(state.id) : undefined}
              diffOnly={isDiffMode}
              activeBranchLabel={isDiffMode ? activeBranchLabel : undefined}
              compareBranchLabel={isDiffMode ? compareBranchLabel : undefined}
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
