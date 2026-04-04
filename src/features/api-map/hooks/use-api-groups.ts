'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/libs/app-store';
import { getApiGroups, getTotalEndpoints } from '../services/api-groups';

export function useApiGroups() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['api-groups', branch],
    queryFn: () => getApiGroups(branch),
    staleTime: Infinity,
  });
}

export function useTotalEndpoints() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['total-endpoints', branch],
    queryFn: () => getTotalEndpoints(branch),
    staleTime: Infinity,
  });
}
