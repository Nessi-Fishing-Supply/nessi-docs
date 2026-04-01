import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { LifecycleList } from '@/features/lifecycles/lifecycle-list';

export default async function LifecyclesIndex({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  return (
    <Suspense>
      <LifecycleList lifecycles={data.lifecycles} />
    </Suspense>
  );
}
