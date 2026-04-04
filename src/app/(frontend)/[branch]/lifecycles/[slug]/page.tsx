import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
import { getLifecycle } from '@/features/lifecycles';
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
  const pageData = getLifecycle(branch, slug);
  return { title: pageData ? pageData.lifecycle.name : 'Lifecycle' };
}

export default async function LifecyclePage({
  params,
}: {
  params: Promise<{ branch: string; slug: string }>;
}) {
  const { branch, slug } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const pageData = getLifecycle(branch, slug);
  if (!pageData) notFound();

  return (
    <Suspense>
      <LifecyclePageClient
        lifecycle={pageData.lifecycle}
        siblings={pageData.siblings}
        entityNames={pageData.entityNames}
      />
    </Suspense>
  );
}
