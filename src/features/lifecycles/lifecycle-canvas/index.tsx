'use client';

import type { Lifecycle, LifecycleTransition } from '@/types/lifecycle';
import { useDocsContext } from '@/providers/docs-provider';
import { CanvasProvider } from '@/features/canvas/canvas-provider';
import { StateNode } from '@/features/canvas/components/state-node';
import { LabelPill } from '@/features/canvas/components/label-pill';
import {
  LIFECYCLE_NODE_WIDTH,
  LIFECYCLE_NODE_HEIGHT,
  bezier,
} from '@/features/canvas/utils/geometry';

interface LifecycleCanvasProps {
  lifecycle: Lifecycle;
}

function getTransitionPath(
  t: LifecycleTransition,
  stateMap: Map<string, { x: number; y: number }>,
) {
  // If explicit coords provided, use them
  if (
    t.fx !== undefined &&
    t.fy !== undefined &&
    t.tx !== undefined &&
    t.ty !== undefined
  ) {
    return {
      d: bezier(t.fx, t.fy, t.tx, t.ty),
      mx: (t.fx + t.tx) / 2,
      my: (t.fy + t.ty) / 2,
    };
  }

  const from = stateMap.get(t.from);
  const to = stateMap.get(t.to);
  if (!from || !to) return null;

  let fx: number, fy: number, tx: number, ty: number;

  if (t.side === 'r-l') {
    fx = from.x + LIFECYCLE_NODE_WIDTH;
    fy = from.y + LIFECYCLE_NODE_HEIGHT / 2;
    tx = to.x;
    ty = to.y + LIFECYCLE_NODE_HEIGHT / 2;
  } else if (t.side === 'b-t') {
    fx = from.x + LIFECYCLE_NODE_WIDTH / 2;
    fy = from.y + LIFECYCLE_NODE_HEIGHT;
    tx = to.x + LIFECYCLE_NODE_WIDTH / 2;
    ty = to.y;
  } else {
    // Default: right to left
    fx = from.x + LIFECYCLE_NODE_WIDTH;
    fy = from.y + LIFECYCLE_NODE_HEIGHT / 2;
    tx = to.x;
    ty = to.y + LIFECYCLE_NODE_HEIGHT / 2;
  }

  return { d: bezier(fx, fy, tx, ty), mx: (fx + tx) / 2, my: (fy + ty) / 2 };
}

export function LifecycleCanvas({ lifecycle }: LifecycleCanvasProps) {
  const { selectedItem, setSelectedItem } = useDocsContext();
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
    minY: minY - padding - 40, // extra room for title
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2 + 40,
  };

  return (
    <CanvasProvider viewBox={viewBox}>
      {/* Title */}
      <text
        x={minX}
        y={minY - padding + 10}
        fill="#e8e6e1"
        fontSize={16}
        fontWeight={600}
        fontFamily="var(--font-dm-serif)"
      >
        {lifecycle.name}
      </text>
      <text x={minX} y={minY - padding + 28} fill="#6a6860" fontSize={10}>
        {lifecycle.badge} · {lifecycle.description.slice(0, 80)}...
      </text>

      {/* Transitions (edges) */}
      {lifecycle.transitions.map((t, i) => {
        const path = getTransitionPath(t, stateMap);
        if (!path) return null;
        return (
          <g key={i}>
            <path
              d={path.d}
              fill="none"
              stroke="rgba(154,151,144,0.3)"
              strokeWidth={1.5}
              markerEnd="url(#arrow)"
            />
            <LabelPill x={path.mx} y={path.my} label={t.label} />
          </g>
        );
      })}

      {/* State nodes */}
      {lifecycle.states.map((state) => {
        const isSelected =
          selectedItem?.type === 'lifecycle-state' &&
          selectedItem.state.id === state.id;
        return (
          <StateNode
            key={state.id}
            state={state}
            isSelected={isSelected}
            onClick={() =>
              setSelectedItem({ type: 'lifecycle-state', state, lifecycle })
            }
          />
        );
      })}
    </CanvasProvider>
  );
}
