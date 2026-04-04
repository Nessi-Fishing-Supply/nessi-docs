'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/libs/app-store';
import { getChangelog } from '../services/changelog';

export function useChangelog() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['changelog', branch],
    queryFn: () => getChangelog(branch),
    staleTime: Infinity,
  });
}
