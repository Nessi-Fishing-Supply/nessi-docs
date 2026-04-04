'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app-store';
import { getConfigEnums, getRoles } from '../services/config';

export function useConfigEnums() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['config-enums', branch],
    queryFn: () => getConfigEnums(branch),
    staleTime: Infinity,
  });
}

export function useRoles() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['roles', branch],
    queryFn: () => getRoles(branch),
    staleTime: Infinity,
  });
}
