import { loadBranch } from '@/data/branch-loader';
import type { ConfigEnum } from '../types/config-ref';
import type { Role } from '../types/permission';

export function getConfigEnums(branch: string): ConfigEnum[] {
  const data = loadBranch(branch);
  return data?.configEnums ?? [];
}

export function getRoles(branch: string): Role[] {
  const data = loadBranch(branch);
  return data?.roles ?? [];
}
