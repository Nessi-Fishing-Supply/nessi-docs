import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getEntities, getErdData, ErdCanvas } from '@/features/data-model';

export const metadata = { title: 'Entity Relationships' };

export default async function EntityRelationshipsPage({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch } = await params;
  if (!loadBranch(branch)) notFound();
  const { nodes, edges, categoryGroups } = getErdData(branch);
  const entities = getEntities(branch);

  return (
    <Suspense>
      <ErdCanvas
        nodes={nodes}
        edges={edges}
        entities={entities}
        categoryGroups={categoryGroups}
      />
    </Suspense>
  );
}
