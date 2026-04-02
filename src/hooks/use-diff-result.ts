'use client';

import { useMemo } from 'react';

import { useAppStore } from '@/stores/app-store';
import { computeDiff } from '@/data/diff-engine';
import type { DiffResult } from '@/types/diff';

export function useDiffResult(): {
  isActive: boolean;
  compareBranch: string | null;
  diffResult: DiffResult | null;
} {
  const mode = useAppStore.use.mode();
  const comparisonBranch = useAppStore.use.comparisonBranch();
  const activeData = useAppStore.use.activeData();
  const allBranchData = useAppStore.use.allBranchData();

  const comparisonData = comparisonBranch ? (allBranchData[comparisonBranch] ?? null) : null;

  const diffResult = useMemo<DiffResult | null>(() => {
    if (!comparisonData || !activeData) return null;
    return computeDiff(activeData, comparisonData);
  }, [comparisonData, activeData]);

  return {
    isActive: mode === 'diff' && !!comparisonData,
    compareBranch: comparisonBranch,
    diffResult,
  };
}
