'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/libs/app-store';
import { getLifecycles, getLifecycle } from '../services/lifecycles';

export function useLifecycles() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['lifecycles', branch],
    queryFn: () => getLifecycles(branch),
    staleTime: Infinity,
  });
}

export function useLifecycle(slug: string) {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['lifecycle', branch, slug],
    queryFn: () => getLifecycle(branch, slug),
    staleTime: Infinity,
  });
}
