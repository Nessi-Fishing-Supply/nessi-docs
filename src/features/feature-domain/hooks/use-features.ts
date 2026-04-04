'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/libs/app-store';
import { getFeatureDomains, getFeatureDomainPageData } from '../services/features';

export function useFeatureDomains() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['feature-domains', branch],
    queryFn: () => getFeatureDomains(branch),
    staleTime: Infinity,
  });
}

export function useFeatureDomainPageData(slug: string) {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['feature-domain-page', branch, slug],
    queryFn: () => getFeatureDomainPageData(branch, slug),
    staleTime: Infinity,
  });
}
