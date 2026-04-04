'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import { useAppStore } from '@/libs/app-store';

export function useUrlSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlCompare = searchParams.get('compare');
  const storeCompare = useAppStore.use.comparisonBranch();
  const allBranchData = useAppStore.use.allBranchData();
  const activeBranch = useAppStore.use.activeBranch();

  // URL -> Store
  useEffect(() => {
    if (urlCompare && urlCompare !== activeBranch && allBranchData[urlCompare]) {
      if (storeCompare !== urlCompare) {
        useAppStore.getState().activateDiffMode(urlCompare);
      }
    } else if (!urlCompare && storeCompare) {
      useAppStore.getState().deactivateDiffMode();
    }
  }, [urlCompare, activeBranch, allBranchData, storeCompare]);

  return {
    activateDiff: (branchName: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('compare', branchName);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    deactivateDiff: () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('compare');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
  };
}
