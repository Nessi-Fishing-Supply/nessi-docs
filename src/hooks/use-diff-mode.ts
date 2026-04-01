'use client';

import { useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useBranchData } from '@/providers/branch-provider';
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
  const { activeData, setComparisonBranch, allBranchData, activeBranch } = useBranchData();

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
    if (!comparisonData) return null;
    return computeDiff(comparisonData, activeData);
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
