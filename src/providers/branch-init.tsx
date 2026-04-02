'use client';

import { useEffect, type ReactNode, Suspense } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useUrlSync } from '@/hooks/use-url-sync';
import type { BranchData } from '@/types/branch';

function UrlSyncInner() {
  useUrlSync();
  return null;
}

interface BranchInitProps {
  branchName: string;
  branchData: BranchData;
  allBranchData: Record<string, BranchData>;
  children: ReactNode;
}

export function BranchInit({ branchName, branchData, allBranchData, children }: BranchInitProps) {
  useEffect(() => {
    useAppStore.getState().initBranch(branchName, branchData, allBranchData);
  }, [branchName, branchData, allBranchData]);

  return (
    <>
      <Suspense>
        <UrlSyncInner />
      </Suspense>
      {children}
    </>
  );
}
