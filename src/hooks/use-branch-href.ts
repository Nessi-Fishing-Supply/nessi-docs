'use client';

import { useCallback } from 'react';

import { useAppStore } from '@/stores/app-store';

export function useBranchHref() {
  const activeBranch = useAppStore.use.activeBranch();
  const comparisonBranch = useAppStore.use.comparisonBranch();

  return useCallback(
    (path: string) => {
      const base = `/${activeBranch}${path.startsWith('/') ? path : `/${path}`}`;
      if (!comparisonBranch) return base;
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}compare=${comparisonBranch}`;
    },
    [activeBranch, comparisonBranch],
  );
}
