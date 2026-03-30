export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 44;
export const DECISION_SIZE = 48;
export const LIFECYCLE_NODE_WIDTH = 170;
export const LIFECYCLE_NODE_HEIGHT = 48;
export const ERD_NODE_WIDTH = 160;
export const ERD_NODE_HEIGHT = 52;

export function getPort(
  node: { x: number; y: number; type: string },
  side: PortSide,
): { x: number; y: number } {
  if (node.type === 'decision') {
    const cx = node.x + DECISION_SIZE / 2;
    const cy = node.y + DECISION_SIZE / 2;
    switch (side) {
      case 'right':
        return { x: node.x + DECISION_SIZE, y: cy };
      case 'left':
        return { x: node.x, y: cy };
      case 'bottom':
        return { x: cx, y: node.y + DECISION_SIZE };
      case 'top':
        return { x: cx, y: node.y };
    }
  }
  const cx = node.x + NODE_WIDTH / 2;
  const cy = node.y + NODE_HEIGHT / 2;
  switch (side) {
    case 'right':
      return { x: node.x + NODE_WIDTH, y: cy };
    case 'left':
      return { x: node.x, y: cy };
    case 'bottom':
      return { x: cx, y: node.y + NODE_HEIGHT };
    case 'top':
      return { x: cx, y: node.y };
  }
}

/**
 * Auto-detect the best exit/entry port sides based on relative node positions.
 * Same approach used by lifecycle and ERD canvases.
 */
export function autoPortSides(
  from: { x: number; y: number; type: string },
  to: { x: number; y: number; type: string },
): [PortSide, PortSide] {
  const fw = from.type === 'decision' ? DECISION_SIZE : NODE_WIDTH;
  const fh = from.type === 'decision' ? DECISION_SIZE : NODE_HEIGHT;
  const tw = to.type === 'decision' ? DECISION_SIZE : NODE_WIDTH;
  const th = to.type === 'decision' ? DECISION_SIZE : NODE_HEIGHT;

  const fromCx = from.x + fw / 2;
  const fromCy = from.y + fh / 2;
  const toCx = to.x + tw / 2;
  const toCy = to.y + th / 2;

  const dx = toCx - fromCx;
  const dy = toCy - fromCy;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal dominant
    return dx > 0 ? ['right', 'left'] : ['left', 'right'];
  } else {
    // Vertical dominant
    return dy > 0 ? ['bottom', 'top'] : ['top', 'bottom'];
  }
}

/**
 * Journey-specific port selection: always left-to-right flow.
 * - Same column + vertical offset → bottom/top
 * - Back-edge (target left of source) → top/top (arc above)
 * - Default → right/left
 * - Decision alternate branches → bottom/left (fork down then continue right)
 */
export function journeyPortSides(
  from: { x: number; y: number; type: string },
  to: { x: number; y: number; type: string },
  opts?: { isBackEdge?: boolean; isDecisionBranch?: boolean },
): [PortSide, PortSide] {
  const fw = from.type === 'decision' ? DECISION_SIZE : NODE_WIDTH;
  const tw = to.type === 'decision' ? DECISION_SIZE : NODE_WIDTH;
  const fromCx = from.x + fw / 2;
  const toCx = to.x + tw / 2;

  // Back-edges: arc above via top ports
  if (opts?.isBackEdge) {
    return ['top', 'top'];
  }

  // Same column (vertical edge within a fork group)
  if (Math.abs(fromCx - toCx) < 10) {
    const fromCy = from.y + (from.type === 'decision' ? DECISION_SIZE / 2 : NODE_HEIGHT / 2);
    const toCy = to.y + (to.type === 'decision' ? DECISION_SIZE / 2 : NODE_HEIGHT / 2);
    return toCy > fromCy ? ['bottom', 'top'] : ['top', 'bottom'];
  }

  // Decision alternate branch: exit bottom, enter left
  if (opts?.isDecisionBranch && from.type === 'decision') {
    return ['bottom', 'left'];
  }

  // Default: strict left-to-right
  return ['right', 'left'];
}

/**
 * Simple horizontal-biased bezier (legacy — only appropriate for strict left→right flows).
 */
export function bezier(fx: number, fy: number, tx: number, ty: number): string {
  const dx = Math.abs(tx - fx);
  const cp = Math.max(dx * 0.4, 30);
  return `M${fx},${fy} C${fx + cp},${fy} ${tx - cp},${ty} ${tx},${ty}`;
}

export type PortSide = 'left' | 'right' | 'top' | 'bottom';

/**
 * Direction-aware bezier that extends control points along the exit/entry direction.
 * Produces clean curves regardless of the angle between source and target.
 */
export function smoothPath(
  fx: number,
  fy: number,
  fDir: PortSide,
  tx: number,
  ty: number,
  tDir: PortSide,
): string {
  const dist = Math.sqrt((tx - fx) ** 2 + (ty - fy) ** 2);
  const cp = Math.max(dist * 0.35, 40);

  const [cp1x, cp1y] = cpOffset(fx, fy, fDir, cp);
  const [cp2x, cp2y] = cpOffset(tx, ty, tDir, cp);

  return `M${fx},${fy} C${cp1x},${cp1y} ${cp2x},${cp2y} ${tx},${ty}`;
}

/**
 * Back-edge arc: curves above the flow from a later node back to an earlier one.
 * Uses a large vertical offset to arc above intervening nodes.
 */
export function backEdgeArc(
  fx: number,
  fy: number,
  tx: number,
  ty: number,
): string {
  const dx = Math.abs(tx - fx);
  const arcHeight = Math.max(dx * 0.3, 60);
  const midX = (fx + tx) / 2;
  const midY = Math.min(fy, ty) - arcHeight;
  return `M${fx},${fy} Q${midX},${midY} ${tx},${ty}`;
}

function cpOffset(x: number, y: number, dir: PortSide, amount: number): [number, number] {
  switch (dir) {
    case 'right':
      return [x + amount, y];
    case 'left':
      return [x - amount, y];
    case 'bottom':
      return [x, y + amount];
    case 'top':
      return [x, y - amount];
  }
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function getLifecyclePort(
  state: { x: number; y: number },
  side: 'left' | 'right' | 'top' | 'bottom',
): { x: number; y: number } {
  const cx = state.x + LIFECYCLE_NODE_WIDTH / 2;
  const cy = state.y + LIFECYCLE_NODE_HEIGHT / 2;
  switch (side) {
    case 'left':
      return { x: state.x, y: cy };
    case 'right':
      return { x: state.x + LIFECYCLE_NODE_WIDTH, y: cy };
    case 'top':
      return { x: cx, y: state.y };
    case 'bottom':
      return { x: cx, y: state.y + LIFECYCLE_NODE_HEIGHT };
  }
}
