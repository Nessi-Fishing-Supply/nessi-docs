import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
import { getArchDiagram } from '@/features/architecture';
import { ArchitecturePageClient } from './client';

export function generateStaticParams() {
  return getBranchNames().flatMap((branch) => {
    const data = loadBranch(branch);
    if (!data) return [];
    return data.archDiagrams.map((d) => ({ branch, slug: d.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ branch: string; slug: string }>;
}) {
  const { branch, slug } = await params;
  const pageData = getArchDiagram(branch, slug);
  return { title: pageData ? pageData.diagram.title : 'Architecture' };
}

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ branch: string; slug: string }>;
}) {
  const { branch, slug } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const pageData = getArchDiagram(branch, slug);
  if (!pageData) notFound();

  return (
    <Suspense>
      <ArchitecturePageClient diagram={pageData.diagram} siblings={pageData.siblings} />
    </Suspense>
  );
}
