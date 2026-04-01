import { useMemo } from 'react';
import type { DiffStatus } from '@/types/diff';

interface DiffNodesResult<T> {
  statusMap: Map<string, DiffStatus>;
  ghostNodes: T[];
}

export function useDiffNodes<T>(
  headNodes: T[],
  baseNodes: T[] | null,
  getKey: (node: T) => string,
): DiffNodesResult<T> {
  return useMemo(() => {
    if (!baseNodes) {
      return { statusMap: new Map(), ghostNodes: [] };
    }

    const baseMap = new Map<string, T>();
    for (const node of baseNodes) baseMap.set(getKey(node), node);

    const headMap = new Map<string, T>();
    for (const node of headNodes) headMap.set(getKey(node), node);

    const statusMap = new Map<string, DiffStatus>();
    const ghostNodes: T[] = [];

    for (const node of headNodes) {
      const key = getKey(node);
      const baseNode = baseMap.get(key);
      if (!baseNode) {
        statusMap.set(key, 'added');
      } else if (JSON.stringify(baseNode) !== JSON.stringify(node)) {
        statusMap.set(key, 'modified');
      } else {
        statusMap.set(key, 'unchanged');
      }
    }

    for (const node of baseNodes) {
      const key = getKey(node);
      if (!headMap.has(key)) {
        statusMap.set(key, 'removed');
        ghostNodes.push(node);
      }
    }

    return { statusMap, ghostNodes };
  }, [headNodes, baseNodes, getKey]);
}
