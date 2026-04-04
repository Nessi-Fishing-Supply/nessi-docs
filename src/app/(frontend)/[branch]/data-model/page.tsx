import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getEntities, EntityList } from '@/features/data-model';

export const metadata = { title: 'Data Model' };

export default async function DataModelPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  if (!loadBranch(branch)) notFound();
  const entities = getEntities(branch);

  return (
    <Suspense>
      <EntityList entities={entities} />
    </Suspense>
  );
}
