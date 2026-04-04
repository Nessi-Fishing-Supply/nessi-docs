'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/libs/app-store';
import { getJourneyDomains, getDomainJourneys, getJourney } from '../services/journeys';

export function useJourneyDomains() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['journey-domains', branch],
    queryFn: () => getJourneyDomains(branch),
    staleTime: Infinity,
  });
}

export function useDomainJourneys(domain: string) {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['domain-journeys', branch, domain],
    queryFn: () => getDomainJourneys(branch, domain),
    staleTime: Infinity,
  });
}

export function useJourney(domain: string, slug: string) {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['journey', branch, domain, slug],
    queryFn: () => getJourney(branch, domain, slug),
    staleTime: Infinity,
  });
}
