import { notFound } from 'next/navigation';
import { getDashboardData, DashboardView } from '@/features/dashboard';

export const metadata = { title: 'Dashboard | Nessi Docs' };

export default async function DashboardPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = getDashboardData(branch);
  if (!data) notFound();

  return (
    <DashboardView
      metrics={data.metrics}
      domains={data.domains}
      recentChanges={data.recentChanges}
    />
  );
}
