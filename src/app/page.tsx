import { getDashboardMetrics, getFeatureDomains, changelog } from '@/data';
import { DashboardView } from '@/features/dashboard/dashboard-view';

export const metadata = { title: 'Dashboard | Nessi Docs' };

export default function DashboardPage() {
  return (
    <DashboardView
      metrics={getDashboardMetrics()}
      domains={getFeatureDomains()}
      recentChanges={changelog.slice(0, 5)}
    />
  );
}
