/* ------------------------------------------------------------------ */
/*  ERD Category-Clustered Layout                                      */
/*  Groups entities by category into containers, lays out in 2 cols    */
/* ------------------------------------------------------------------ */

import type { ErdNode, ErdCategoryGroup } from '@/types/entity-relationship';
import type { RawErdNode, RawEntity } from '../raw-types';
import { ENTITY_CATEGORY_MAP } from '../transforms/entities';

export type { ErdCategoryGroup };

const ERD_NODE_W = 160;
const ERD_NODE_H = 52;
const ERD_NODE_GAP_X = 80;
const ERD_NODE_GAP_Y = 70;
const ERD_GROUP_PADDING = 32;
const ERD_GROUP_HEADER = 36;
const ERD_GROUP_GAP = 100;
const ERD_GROUP_COL_GAP = 160;
const ERD_NODES_PER_ROW = 3; // Nodes per row within a group

const ERD_CATEGORY_ORDER: { key: string; label: string; color: string }[] = [
  { key: 'core', label: 'Core', color: '#3d8c75' },
  { key: 'shops', label: 'Shop Management', color: '#d4923a' },
  { key: 'commerce', label: 'Commerce', color: '#e27739' },
  { key: 'social', label: 'Social', color: '#9b7bd4' },
  { key: 'messaging', label: 'Messaging', color: '#5b9fd6' },
  { key: 'content', label: 'Content & Discovery', color: '#5bbfcf' },
  { key: 'user', label: 'User', color: '#8a8580' },
];

let _erdCategoryGroups: ErdCategoryGroup[] = [];

export function transformErdNodes(rawNodes: RawErdNode[], rawEntities: RawEntity[]): ErdNode[] {
  const entityMap = new Map(rawEntities.map((e) => [e.name, e]));

  // If all nodes already have x/y, just enrich with badge/fieldCount
  const allHavePositions = rawNodes.every(
    (n) => typeof n.x === 'number' && typeof n.y === 'number',
  );
  if (allHavePositions) {
    _erdCategoryGroups = [];
    return rawNodes.map((node) => {
      const entity = entityMap.get(node.id);
      return {
        id: node.id,
        label: node.label,
        badge: ENTITY_CATEGORY_MAP[node.id],
        fieldCount: entity?.fields.length,
        x: node.x as number,
        y: node.y as number,
      };
    });
  }

  // Group nodes by category
  const groups = new Map<string, RawErdNode[]>();
  for (const node of rawNodes) {
    const cat = ENTITY_CATEGORY_MAP[node.id] ?? 'system';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(node);
  }

  // Compute group dimensions and positions
  const positioned: ErdNode[] = [];
  const categoryGroups: ErdCategoryGroup[] = [];

  // Lay out groups in 2 columns, filling top-to-bottom in each column
  const colYOffsets = [0, 0]; // Track current y for each column

  for (const catDef of ERD_CATEGORY_ORDER) {
    const groupNodes = groups.get(catDef.key);
    if (!groupNodes || groupNodes.length === 0) continue;

    // Compute group internal layout
    const nodesPerRow = Math.min(ERD_NODES_PER_ROW, groupNodes.length);
    const rows = Math.ceil(groupNodes.length / nodesPerRow);
    const contentW = nodesPerRow * ERD_NODE_W + (nodesPerRow - 1) * ERD_NODE_GAP_X;
    const contentH = rows * ERD_NODE_H + (rows - 1) * ERD_NODE_GAP_Y;
    const groupW = contentW + ERD_GROUP_PADDING * 2;
    const groupH = contentH + ERD_GROUP_PADDING * 2 + ERD_GROUP_HEADER;

    // Pick the shorter column
    const col = colYOffsets[0] <= colYOffsets[1] ? 0 : 1;

    // Compute max group width for this column (for alignment)
    const groupX = col * (groupW + ERD_GROUP_COL_GAP);
    const groupY = colYOffsets[col];

    categoryGroups.push({
      key: catDef.key,
      label: catDef.label,
      color: catDef.color,
      x: groupX,
      y: groupY,
      width: groupW,
      height: groupH,
    });

    // Position nodes within the group
    const contentX = groupX + ERD_GROUP_PADDING;
    const contentY = groupY + ERD_GROUP_PADDING + ERD_GROUP_HEADER;

    for (let i = 0; i < groupNodes.length; i++) {
      const node = groupNodes[i];
      const nodeCol = i % nodesPerRow;
      const nodeRow = Math.floor(i / nodesPerRow);
      const entity = entityMap.get(node.id);
      positioned.push({
        id: node.id,
        label: node.label,
        badge: catDef.key,
        fieldCount: entity?.fields.length,
        x: contentX + nodeCol * (ERD_NODE_W + ERD_NODE_GAP_X),
        y: contentY + nodeRow * (ERD_NODE_H + ERD_NODE_GAP_Y),
      });
    }

    colYOffsets[col] += groupH + ERD_GROUP_GAP;
  }

  // Align group widths within each column
  const leftGroups = categoryGroups.filter((g) => g.x === 0);
  const rightGroups = categoryGroups.filter((g) => g.x > 0);
  const maxLeftW = Math.max(...leftGroups.map((g) => g.width), 0);
  const maxRightW = Math.max(...rightGroups.map((g) => g.width), 0);
  for (const g of leftGroups) g.width = maxLeftW;
  // Align right column x and width
  const rightX = maxLeftW + ERD_GROUP_COL_GAP;
  for (const g of rightGroups) {
    g.x = rightX;
    g.width = maxRightW;
  }
  // Shift right-column node x positions to match
  for (const node of positioned) {
    const group = categoryGroups.find((g) => g.key === node.badge);
    if (group && group.x === rightX) {
      const oldGroup = ERD_CATEGORY_ORDER.find((c) => c.key === node.badge);
      if (oldGroup) {
        // Recompute node x relative to the aligned group x
        const groupNodes = groups.get(node.badge ?? 'system')!;
        const idx = groupNodes.findIndex((n) => n.id === node.id);
        const nodesPerRow = Math.min(ERD_NODES_PER_ROW, groupNodes.length);
        const nodeCol = idx % nodesPerRow;
        node.x = rightX + ERD_GROUP_PADDING + nodeCol * (ERD_NODE_W + ERD_NODE_GAP_X);
      }
    }
  }

  _erdCategoryGroups = categoryGroups;
  return positioned;
}

export function getErdCategoryGroups(): ErdCategoryGroup[] {
  return _erdCategoryGroups;
}
