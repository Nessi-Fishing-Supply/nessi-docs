import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getArchDiagrams, ArchitectureList } from '@/features/architecture';

export default async function ArchitectureIndex({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const diagrams = getArchDiagrams(branch);

  return (
    <Suspense>
      <ArchitectureList diagrams={diagrams} />
    </Suspense>
  );
}
