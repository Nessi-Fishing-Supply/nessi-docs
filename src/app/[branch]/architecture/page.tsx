import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { ArchitectureList } from '@/features/architecture/architecture-list';

export default async function ArchitectureIndex({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  return <ArchitectureList diagrams={data.archDiagrams} />;
}
