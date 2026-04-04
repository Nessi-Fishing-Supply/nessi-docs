import { loadBranch } from '@/data/branch-loader';
import { getDashboardMetrics, getFeatureDomains } from '@/data/transforms/features';
import type { RawJourney, RawLifecycle, RawEntity } from '@/data/raw-types';
import type { DashboardMetrics, FeatureDomain } from '@/types/dashboard';
import type { ChangelogEntry } from '@/types/changelog';

export interface DashboardData {
  metrics: DashboardMetrics;
  domains: FeatureDomain[];
  recentChanges: ChangelogEntry[];
}

export function getDashboardData(branch: string): DashboardData | null {
  const data = loadBranch(branch);
  if (!data) return null;

  const metrics = getDashboardMetrics({
    features: data.features,
    apiGroups: data.apiGroups,
    journeys: data.journeys as unknown as RawJourney[],
    entities: data.entities as unknown as RawEntity[],
    lifecycles: data.lifecycles as unknown as RawLifecycle[],
  });

  const domains = getFeatureDomains(
    data.features,
    data.journeys as unknown as RawJourney[],
  );

  return {
    metrics,
    domains,
    recentChanges: data.changelog.slice(0, 5),
  };
}

export function getDashboardMetricsForBranch(branch: string): DashboardMetrics | null {
  const data = loadBranch(branch);
  if (!data) return null;
  return getDashboardMetrics({
    features: data.features,
    apiGroups: data.apiGroups,
    journeys: data.journeys as unknown as RawJourney[],
    entities: data.entities as unknown as RawEntity[],
    lifecycles: data.lifecycles as unknown as RawLifecycle[],
  });
}

export function getFeatureDomainsForBranch(branch: string): FeatureDomain[] {
  const data = loadBranch(branch);
  if (!data) return [];
  return getFeatureDomains(data.features, data.journeys as unknown as RawJourney[]);
}
