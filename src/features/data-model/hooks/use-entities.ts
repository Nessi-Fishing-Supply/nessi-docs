'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app-store';
import { getEntities, getErdData } from '../services/entities';

export function useEntities() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['entities', branch],
    queryFn: () => getEntities(branch),
    staleTime: Infinity,
  });
}

export function useErdData() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['erd-data', branch],
    queryFn: () => getErdData(branch),
    staleTime: Infinity,
  });
}
