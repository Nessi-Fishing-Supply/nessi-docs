'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/libs/app-store';
import { getArchDiagrams, getArchDiagram } from '../services/arch-diagrams';

export function useArchDiagrams() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['arch-diagrams', branch],
    queryFn: () => getArchDiagrams(branch),
    staleTime: Infinity,
  });
}

export function useArchDiagram(slug: string) {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['arch-diagram', branch, slug],
    queryFn: () => getArchDiagram(branch, slug),
    staleTime: Infinity,
  });
}
