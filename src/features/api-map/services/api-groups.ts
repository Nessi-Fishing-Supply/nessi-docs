import { loadBranch } from '@/data/branch-loader';
import type { ApiGroup } from '@/types/api-contract';

export function getApiGroups(branch: string): ApiGroup[] {
  const data = loadBranch(branch);
  return data?.apiGroups ?? [];
}

export function getTotalEndpoints(branch: string): number {
  const groups = getApiGroups(branch);
  return groups.reduce((sum, g) => sum + g.endpoints.length, 0);
}
