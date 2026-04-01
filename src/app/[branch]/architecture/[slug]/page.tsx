import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
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
  const data = loadBranch(branch);
  const diagram = data?.archDiagrams.find((d) => d.slug === slug);
  return { title: diagram ? diagram.title : 'Architecture' };
}

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ branch: string; slug: string }>;
}) {
  const { branch, slug } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const diagram = data.archDiagrams.find((d) => d.slug === slug);
  if (!diagram) notFound();

  const siblings = data.archDiagrams.map((d) => ({
    slug: d.slug,
    title: d.title,
    description: d.description,
  }));

  return <ArchitecturePageClient diagram={diagram} siblings={siblings} />;
}
