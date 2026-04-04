import { loadBranch } from '@/data/branch-loader';
import type { Entity } from '@/types/data-model';
import type { ErdNode, ErdEdge, ErdCategoryGroup } from '@/types/entity-relationship';

export function getEntities(branch: string): Entity[] {
  const data = loadBranch(branch);
  return data?.entities ?? [];
}

export function getErdData(branch: string) {
  const data = loadBranch(branch);
  if (!data) return { nodes: [] as ErdNode[], edges: [] as ErdEdge[], categoryGroups: [] as ErdCategoryGroup[] };
  return {
    nodes: data.erdNodes,
    edges: data.erdEdges,
    categoryGroups: data.erdCategoryGroups,
  };
}
