'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/libs/app-store';
import {
  getDashboardData,
  getDashboardMetricsForBranch,
  getFeatureDomainsForBranch,
} from '../services/dashboard';

export function useDashboardData() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['dashboard', branch],
    queryFn: () => getDashboardData(branch),
    staleTime: Infinity,
  });
}

export function useDashboardMetrics() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['dashboard-metrics', branch],
    queryFn: () => getDashboardMetricsForBranch(branch),
    staleTime: Infinity,
  });
}

export function useFeatureDomains() {
  const branch = useAppStore.use.activeBranch();
  return useQuery({
    queryKey: ['feature-domains', branch],
    queryFn: () => getFeatureDomainsForBranch(branch),
    staleTime: Infinity,
  });
}
