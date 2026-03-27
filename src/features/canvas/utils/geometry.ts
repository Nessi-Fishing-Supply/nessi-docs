export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 44;
export const DECISION_SIZE = 48;
export const LIFECYCLE_NODE_WIDTH = 170;
export const LIFECYCLE_NODE_HEIGHT = 48;
export const ERD_NODE_WIDTH = 160;
export const ERD_NODE_HEIGHT = 52;

export function getPort(
  node: { x: number; y: number; type: string },
  side: 'left' | 'right',
): { x: number; y: number } {
  if (node.type === 'decision') {
    const cy = node.y + DECISION_SIZE / 2;
    return side === 'right' ? { x: node.x + DECISION_SIZE, y: cy } : { x: node.x, y: cy };
  }
  return side === 'right'
    ? { x: node.x + NODE_WIDTH, y: node.y + NODE_HEIGHT / 2 }
    : { x: node.x, y: node.y + NODE_HEIGHT / 2 };
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

function cpOffset(
  x: number,
  y: number,
  dir: PortSide,
  amount: number,
): [number, number] {
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
