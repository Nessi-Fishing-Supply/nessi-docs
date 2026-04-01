import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getDashboardMetrics, getFeatureDomains } from '@/data/transforms/features';
import type { RawJourney, RawLifecycle, RawEntity } from '@/data/raw-types';
import { DashboardView } from '@/features/dashboard/dashboard-view';

export const metadata = { title: 'Dashboard | Nessi Docs' };

export default async function DashboardPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const metrics = getDashboardMetrics({
    features: data.features,
    apiGroups: data.apiGroups,
    journeys: data.journeys as unknown as RawJourney[],
    entities: data.entities as unknown as RawEntity[],
    lifecycles: data.lifecycles as unknown as RawLifecycle[],
  });

  const domains = getFeatureDomains(data.features, data.journeys as unknown as RawJourney[]);

  return (
    <DashboardView metrics={metrics} domains={domains} recentChanges={data.changelog.slice(0, 5)} />
  );
}
