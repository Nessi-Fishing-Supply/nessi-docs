import { loadBranch } from '@/data/branch-loader';
import type { ChangelogEntry } from '@/features/shared/types/changelog';

export function getChangelog(branch: string): ChangelogEntry[] {
  const data = loadBranch(branch);
  return data?.changelog ?? [];
}
