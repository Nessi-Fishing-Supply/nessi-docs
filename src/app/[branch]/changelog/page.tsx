import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { ChangelogFeed } from '@/features/changelog/changelog-feed';

export const metadata = { title: 'Changelog' };

export default async function ChangelogPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  return (
    <Suspense>
      <ChangelogFeed entries={data.changelog} />
    </Suspense>
  );
}
