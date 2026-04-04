import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getLifecycles, LifecycleList } from '@/features/lifecycles';

export default async function LifecyclesIndex({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const lifecycles = getLifecycles(branch);

  return (
    <Suspense>
      <LifecycleList lifecycles={lifecycles} />
    </Suspense>
  );
}
