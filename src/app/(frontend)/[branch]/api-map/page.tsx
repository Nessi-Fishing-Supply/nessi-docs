import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getApiGroups, getTotalEndpoints, ApiList } from '@/features/api-map';

export const metadata = { title: 'API Map' };

export default async function ApiMapPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  if (!loadBranch(branch)) notFound();
  const groups = getApiGroups(branch);
  const totalEndpoints = getTotalEndpoints(branch);

  return (
    <Suspense>
      <ApiList groups={groups} totalEndpoints={totalEndpoints} />
    </Suspense>
  );
}
