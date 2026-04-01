import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
import { getEntitiesForLifecycle } from '@/data/cross-links-lifecycle';
import { LifecyclePageClient } from './client';

export function generateStaticParams() {
  return getBranchNames().flatMap((branch) => {
    const data = loadBranch(branch);
    if (!data) return [];
    return data.lifecycles.map((l) => ({ branch, slug: l.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ branch: string; slug: string }>;
}) {
  const { branch, slug } = await params;
  const data = loadBranch(branch);
  const lc = data?.lifecycles.find((l) => l.slug === slug);
  return { title: lc ? lc.name : 'Lifecycle' };
}

export default async function LifecyclePage({
  params,
}: {
  params: Promise<{ branch: string; slug: string }>;
}) {
  const { branch, slug } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const lifecycle = data.lifecycles.find((l) => l.slug === slug);
  if (!lifecycle) notFound();

  const siblings = data.lifecycles.map((l) => ({
    slug: l.slug,
    name: l.name,
    description: l.description,
  }));

  const entityNames = getEntitiesForLifecycle(data.lifecycles, lifecycle.slug);

  return (
    <Suspense>
      <LifecyclePageClient lifecycle={lifecycle} siblings={siblings} entityNames={entityNames} />
    </Suspense>
  );
}
