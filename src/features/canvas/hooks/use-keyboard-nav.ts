'use client';

import { useEffect, useCallback } from 'react';
import type { JourneyNode, JourneyEdge } from '@/features/journeys';

interface UseKeyboardNavOptions {
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  selectedId: string | null;
  onSelect: (node: JourneyNode) => void;
  onClear: () => void;
}

export function useKeyboardNav({
  nodes,
  edges,
  selectedId,
  onSelect,
  onClear,
}: UseKeyboardNavOptions) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClear();
        return;
      }

      if (!selectedId) {
        // If nothing selected and user presses right arrow or Enter, select first entry node
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          const entry = nodes.find((n) => n.type === 'entry');
          if (entry) onSelect(entry);
        }
        return;
      }

      if (e.key === 'ArrowRight') {
        // Find outgoing edges from current node (non-optional first)
        const outgoing = edges.filter((ed) => ed.from === selectedId && !ed.opt);
        if (outgoing.length > 0) {
          const next = nodes.find((n) => n.id === outgoing[0].to);
          if (next) onSelect(next);
        }
      } else if (e.key === 'ArrowLeft') {
        // Find incoming edges to current node
        const incoming = edges.filter((ed) => ed.to === selectedId && !ed.opt);
        if (incoming.length > 0) {
          const prev = nodes.find((n) => n.id === incoming[0].from);
          if (prev) onSelect(prev);
        }
      } else if (e.key === 'ArrowDown') {
        // Move to nearest node below
        const current = nodes.find((n) => n.id === selectedId);
        if (!current) return;
        const sorted = [...nodes]
          .filter((n) => n.type === 'step' && n.id !== selectedId)
          .sort((a, b) => {
            const da = Math.abs(a.x - current.x) + Math.abs(a.y - current.y);
            const db = Math.abs(b.x - current.x) + Math.abs(b.y - current.y);
            return da - db;
          });
        const below = sorted.find((n) => n.y > current.y);
        if (below) onSelect(below);
      } else if (e.key === 'ArrowUp') {
        // Move to nearest node above
        const current = nodes.find((n) => n.id === selectedId);
        if (!current) return;
        const sorted = [...nodes]
          .filter((n) => n.type === 'step' && n.id !== selectedId)
          .sort((a, b) => {
            const da = Math.abs(a.x - current.x) + Math.abs(a.y - current.y);
            const db = Math.abs(b.x - current.x) + Math.abs(b.y - current.y);
            return da - db;
          });
        const above = sorted.find((n) => n.y < current.y);
        if (above) onSelect(above);
      }
    },
    [nodes, edges, selectedId, onSelect, onClear],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);
}
