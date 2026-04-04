'use client';

import { useMemo } from 'react';

import { useAppStore } from '@/libs/app-store';
import { getDiff } from '../services/diff';
import type { DiffResult } from '../types/diff';

/**
 * Returns the current diff state derived from the Zustand store.
 * Exported as `useDiffResult` for backward-compatible consumption.
 */
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
    return getDiff(activeData, comparisonData);
  }, [comparisonData, activeData]);

  return {
    isActive: mode === 'diff' && !!comparisonData,
    compareBranch: comparisonBranch,
    diffResult,
  };
}
