'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { BranchData, BranchInfo } from '@/types/branch';
import { BRANCHES } from '@/data/branch-registry';

interface BranchContextValue {
  activeBranch: string;
  activeData: BranchData;

  // Comparison branch for future diffing
  comparisonBranch: string | null;
  comparisonData: BranchData | null;
  setComparisonBranch: (name: string | null) => void;

  isDiffMode: boolean;
  branches: BranchInfo[];
}

const BranchContext = createContext<BranchContextValue | null>(null);

interface BranchProviderProps {
  branchName: string;
  branchData: BranchData;
  allBranchData: Record<string, BranchData>;
  children: ReactNode;
}

export function BranchProvider({
  branchName,
  branchData,
  allBranchData,
  children,
}: BranchProviderProps) {
  const [comparisonBranch, setComparisonBranch] = useState<string | null>(null);

  const comparisonData = comparisonBranch ? (allBranchData[comparisonBranch] ?? null) : null;

  const handleSetComparison = useCallback((name: string | null) => {
    setComparisonBranch(name);
  }, []);

  return (
    <BranchContext.Provider
      value={{
        activeBranch: branchName,
        activeData: branchData,
        comparisonBranch,
        comparisonData,
        setComparisonBranch: handleSetComparison,
        isDiffMode: comparisonBranch !== null,
        branches: BRANCHES,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranchData(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranchData must be used within BranchProvider');
  return ctx;
}

/** Returns a function that prefixes a path with the active branch. */
export function useBranchHref() {
  const { activeBranch } = useBranchData();
  return useCallback(
    (path: string) => `/${activeBranch}${path.startsWith('/') ? path : `/${path}`}`,
    [activeBranch],
  );
}
