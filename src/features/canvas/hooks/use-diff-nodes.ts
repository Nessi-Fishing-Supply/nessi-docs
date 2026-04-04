import { useMemo } from 'react';
import type { DiffStatus } from '@/features/shared/types/diff';

export interface NodeChange {
  field: string;
  from: unknown;
  to: unknown;
}

interface DiffNodesResult<T> {
  statusMap: Map<string, DiffStatus>;
  changesMap: Map<string, NodeChange[]>;
  ghostNodes: T[];
}

/** Compare top-level fields between two objects, return list of changed fields. */
function diffNodeFields(base: object, head: object): NodeChange[] {
  const b = base as Record<string, unknown>;
  const h = head as Record<string, unknown>;
  const changes: NodeChange[] = [];
  const allKeys = new Set([...Object.keys(b), ...Object.keys(h)]);

  for (const field of allKeys) {
    if (field === 'x' || field === 'y') continue; // skip position changes
    const bv = b[field];
    const hv = h[field];
    if (JSON.stringify(bv) !== JSON.stringify(hv)) {
      changes.push({ field, from: bv, to: hv });
    }
  }

  return changes;
}

export function useDiffNodes<T>(
  headNodes: T[],
  baseNodes: T[] | null,
  getKey: (node: T) => string,
): DiffNodesResult<T> {
  return useMemo(() => {
    if (!baseNodes) {
      return { statusMap: new Map(), changesMap: new Map(), ghostNodes: [] };
    }

    const baseMap = new Map<string, T>();
    for (const node of baseNodes) baseMap.set(getKey(node), node);

    const headMap = new Map<string, T>();
    for (const node of headNodes) headMap.set(getKey(node), node);

    const statusMap = new Map<string, DiffStatus>();
    const changesMap = new Map<string, NodeChange[]>();
    const ghostNodes: T[] = [];

    for (const node of headNodes) {
      const key = getKey(node);
      const baseNode = baseMap.get(key);
      if (!baseNode) {
        statusMap.set(key, 'added');
      } else {
        const changes = diffNodeFields(baseNode as object, node as object);
        if (changes.length > 0) {
          statusMap.set(key, 'modified');
          changesMap.set(key, changes);
        } else {
          statusMap.set(key, 'unchanged');
        }
      }
    }

    for (const node of baseNodes) {
      const key = getKey(node);
      if (!headMap.has(key)) {
        statusMap.set(key, 'removed');
        ghostNodes.push(node);
      }
    }

    return { statusMap, changesMap, ghostNodes };
  }, [headNodes, baseNodes, getKey]);
}
