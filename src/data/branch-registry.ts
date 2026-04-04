import type { BranchInfo } from '@/features/shared/types/branch';

export const BRANCHES: BranchInfo[] = [
  {
    name: 'main',
    label: 'Production',
    description: 'Live production data',
    color: 'var(--color-green-500, #22c55e)',
    isDefault: true,
  },
  {
    name: 'staging',
    label: 'Staging',
    description: 'Pre-release changes',
    color: 'var(--color-orange-500, #f97316)',
    isDefault: false,
  },
];

export function getBranch(name: string): BranchInfo | undefined {
  return BRANCHES.find((b) => b.name === name);
}

export function getDefaultBranch(): BranchInfo {
  return BRANCHES.find((b) => b.isDefault) ?? BRANCHES[0];
}

export function getBranchNames(): string[] {
  return BRANCHES.map((b) => b.name);
}
