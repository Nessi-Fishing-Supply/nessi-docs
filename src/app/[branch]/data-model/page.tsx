import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { EntityList } from '@/features/data-model/entity-list';

export const metadata = { title: 'Data Model' };

export default async function DataModelPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  return (
    <Suspense>
      <EntityList entities={data.entities} />
    </Suspense>
  );
}
