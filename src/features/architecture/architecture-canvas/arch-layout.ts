import type { ArchDiagram, ArchNode } from '@/types/architecture';

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

export const LAYER_PADDING = 28;
export const LAYER_GAP = 60;
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 58;
export const NODE_GAP_X = 50;
export const NODE_GAP_Y = 40;
export const NODES_PER_ROW = 4;
export const LAYER_HEADER_HEIGHT = 36;

/* ------------------------------------------------------------------ */
/*  Layout types                                                       */
/* ------------------------------------------------------------------ */

export interface PositionedNode {
  node: ArchNode;
  layerId: string;
  x: number;
  y: number;
}

export interface PositionedLayer {
  layer: { id: string; label: string; color?: string };
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ------------------------------------------------------------------ */
/*  Layout engine                                                      */
/* ------------------------------------------------------------------ */

export function computeLayout(diagram: ArchDiagram) {
  const positionedLayers: PositionedLayer[] = [];
  const positionedNodes: PositionedNode[] = [];
  const nodePositions = new Map<string, { x: number; y: number }>();

  let currentY = LAYER_GAP;

  for (const layer of diagram.layers) {
    const cols = Math.min(layer.nodes.length, NODES_PER_ROW);
    const rows = Math.ceil(layer.nodes.length / NODES_PER_ROW);
    const layerContentWidth = cols * NODE_WIDTH + (cols - 1) * NODE_GAP_X;
    const layerContentHeight = rows * NODE_HEIGHT + (rows - 1) * NODE_GAP_Y;
    const layerWidth = layerContentWidth + LAYER_PADDING * 2;
    const layerHeight = layerContentHeight + LAYER_PADDING * 2 + LAYER_HEADER_HEIGHT;

    const layerX = LAYER_GAP;

    positionedLayers.push({
      layer: { id: layer.id, label: layer.label, color: layer.color },
      x: layerX,
      y: currentY,
      width: layerWidth,
      height: layerHeight,
    });

    layer.nodes.forEach((node, idx) => {
      const col = idx % NODES_PER_ROW;
      const row = Math.floor(idx / NODES_PER_ROW);
      const nodeX = layerX + LAYER_PADDING + col * (NODE_WIDTH + NODE_GAP_X);
      const nodeY =
        currentY + LAYER_HEADER_HEIGHT + LAYER_PADDING + row * (NODE_HEIGHT + NODE_GAP_Y);

      positionedNodes.push({ node, layerId: layer.id, x: nodeX, y: nodeY });
      nodePositions.set(node.id, {
        x: nodeX + NODE_WIDTH / 2,
        y: nodeY + NODE_HEIGHT / 2,
      });
    });

    currentY += layerHeight + LAYER_GAP;
  }

  const maxWidth = Math.max(...positionedLayers.map((l) => l.width));
  for (const pl of positionedLayers) {
    pl.width = maxWidth;
  }

  return {
    positionedLayers,
    positionedNodes,
    nodePositions,
    totalWidth: maxWidth + LAYER_GAP * 2,
    totalHeight: currentY,
  };
}
