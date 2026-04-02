'use client';

import { useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { computeDiff } from '@/data/diff-engine';
import type { DiffResult } from '@/types/diff';

export function useDiffMode(): {
  isActive: boolean;
  compareBranch: string | null;
  diffResult: DiffResult | null;
  activate: (branchName: string) => void;
  deactivate: () => void;
} {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeData = useAppStore.use.activeData();
  const allBranchData = useAppStore.use.allBranchData();
  const activeBranch = useAppStore.use.activeBranch();
  const setComparisonBranch = useAppStore.getState().setComparisonBranch;

  const compareBranch = searchParams.get('compare');

  // Sync URL param → context state
  useEffect(() => {
    if (compareBranch && compareBranch !== activeBranch && allBranchData[compareBranch]) {
      setComparisonBranch(compareBranch);
    } else {
      setComparisonBranch(null);
    }
  }, [compareBranch, activeBranch, allBranchData, setComparisonBranch]);

  const comparisonData = compareBranch ? (allBranchData[compareBranch] ?? null) : null;

  const diffResult = useMemo<DiffResult | null>(() => {
    if (!comparisonData || !activeData) return null;
    return computeDiff(activeData, comparisonData);
  }, [comparisonData, activeData]);

  const activate = (branchName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('compare', branchName);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const deactivate = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('compare');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return {
    isActive: !!compareBranch && !!comparisonData,
    compareBranch,
    diffResult,
    activate,
    deactivate,
  };
}
