import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { ErdCanvas } from '@/features/data-model/erd-canvas';

export const metadata = { title: 'Entity Relationships' };

export default async function EntityRelationshipsPage({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  return (
    <Suspense>
      <ErdCanvas
        nodes={data.erdNodes}
        edges={data.erdEdges}
        entities={data.entities}
        categoryGroups={data.erdCategoryGroups}
      />
    </Suspense>
  );
}
