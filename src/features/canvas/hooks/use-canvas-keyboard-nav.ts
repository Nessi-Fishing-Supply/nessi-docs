'use client';

import { useEffect, useCallback } from 'react';

interface CanvasNode {
  id: string;
  x: number;
  y: number;
}

interface UseCanvasKeyboardNavOptions {
  nodes: CanvasNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}

/**
 * Generic spatial keyboard navigation for canvas nodes.
 * Arrow keys move to the nearest node in that direction.
 * Escape clears selection. Enter/ArrowRight selects first node if nothing selected.
 */
export function useCanvasKeyboardNav({
  nodes,
  selectedId,
  onSelect,
  onClear,
}: UseCanvasKeyboardNavOptions) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        onClear();
        return;
      }

      if (!selectedId) {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          if (nodes.length > 0) onSelect(nodes[0].id);
        }
        return;
      }

      const current = nodes.find((n) => n.id === selectedId);
      if (!current) return;

      const others = nodes.filter((n) => n.id !== selectedId);
      if (others.length === 0) return;

      let candidates: CanvasNode[];

      if (e.key === 'ArrowRight') {
        candidates = others.filter((n) => n.x > current.x);
      } else if (e.key === 'ArrowLeft') {
        candidates = others.filter((n) => n.x < current.x);
      } else if (e.key === 'ArrowDown') {
        candidates = others.filter((n) => n.y > current.y);
      } else if (e.key === 'ArrowUp') {
        candidates = others.filter((n) => n.y < current.y);
      } else {
        return;
      }

      if (candidates.length === 0) return;

      // Pick nearest by distance
      candidates.sort((a, b) => {
        const da = Math.abs(a.x - current.x) + Math.abs(a.y - current.y);
        const db = Math.abs(b.x - current.x) + Math.abs(b.y - current.y);
        return da - db;
      });

      e.preventDefault();
      onSelect(candidates[0].id);
    },
    [nodes, selectedId, onSelect, onClear],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);
}
