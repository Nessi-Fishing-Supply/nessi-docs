/* ------------------------------------------------------------------ */
/*  Lifecycle Layout + Color Assignment                                */
/*  Topological sort via transitions → left-to-right positions        */
/* ------------------------------------------------------------------ */

import type { Lifecycle } from '@/features/lifecycles';
import type { RawLifecycle } from '../raw-types';

const LC_NODE_W = 140;
const LC_NODE_H = 60;
const LC_H_GAP = 140;
const LC_V_GAP = 120;

const STATE_COLOR_MAP: Record<string, string> = {
  sold: '#3d8c75',
  accepted: '#3d8c75',
  completed: '#3d8c75',
  active: '#4a9e7a',
  published: '#4a9e7a',
  draft: '#78756f',
  pending: '#b8860b',
  deleted: '#b84040',
  revoked: '#b84040',
  cancelled: '#b84040',
  rejected: '#b84040',
  archived: '#6b6966',
  deactivated: '#6b6966',
  expired: '#a0522d',
  reserved: '#5f7fbf',
};
const DEFAULT_STATE_COLOR = '#78756f';

function getStateColor(stateId: string): string {
  return STATE_COLOR_MAP[stateId] ?? DEFAULT_STATE_COLOR;
}

export function transformLifecycles(raw: RawLifecycle[]): Lifecycle[] {
  return raw.map((lc) => {
    // Build adjacency for topological-ish layout
    const stateIds = lc.states.map((s) => s.id);
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, number>();

    for (const id of stateIds) {
      outgoing.set(id, []);
      incoming.set(id, 0);
    }
    for (const t of lc.transitions) {
      outgoing.get(t.from)?.push(t.to);
      incoming.set(t.to, (incoming.get(t.to) ?? 0) + 1);
    }

    // BFS from root states (no incoming edges) to assign levels (cycle-safe)
    const roots = stateIds.filter((id) => (incoming.get(id) ?? 0) === 0);
    const level = new Map<string, number>();
    const bfsQueue = roots.length > 0 ? [...roots] : [stateIds[0]];
    for (const r of bfsQueue) level.set(r, 0);

    while (bfsQueue.length > 0) {
      const current = bfsQueue.shift()!;
      const currentLevel = level.get(current)!;
      for (const next of outgoing.get(current) ?? []) {
        // Only assign first-seen level — prevents back-edges from inflating levels
        if (!level.has(next)) {
          level.set(next, currentLevel + 1);
          bfsQueue.push(next);
        }
      }
    }

    // Assign any unvisited states
    for (const id of stateIds) {
      if (!level.has(id)) level.set(id, 0);
    }

    // Group by level, then assign x/y
    const byLevel = new Map<number, string[]>();
    for (const [id, lvl] of level) {
      if (!byLevel.has(lvl)) byLevel.set(lvl, []);
      byLevel.get(lvl)!.push(id);
    }

    const positions = new Map<string, { x: number; y: number }>();
    const sortedLevels = [...byLevel.keys()].sort((a, b) => a - b);

    for (const lvl of sortedLevels) {
      const ids = byLevel.get(lvl)!;
      for (let i = 0; i < ids.length; i++) {
        positions.set(ids[i], {
          x: lvl * (LC_NODE_W + LC_H_GAP),
          y: i * (LC_NODE_H + LC_V_GAP),
        });
      }
    }

    return {
      slug: lc.slug,
      name: lc.name,
      badge: lc.badge,
      description: lc.description,
      why: lc.why,
      source: lc.source,
      states: lc.states.map((s) => ({
        id: s.id,
        label: s.label,
        color: getStateColor(s.id),
        x: positions.get(s.id)?.x ?? 0,
        y: positions.get(s.id)?.y ?? 0,
      })),
      transitions: lc.transitions.map((t) => ({
        from: t.from,
        to: t.to,
        label: t.label,
      })),
    };
  });
}
