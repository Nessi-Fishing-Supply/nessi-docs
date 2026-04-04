import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getJourneyDomains, DomainGrid } from '@/features/journeys';

export default async function JourneysIndex({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const domains = getJourneyDomains(branch);

  return (
    <Suspense>
      <DomainGrid domains={domains} />
    </Suspense>
  );
}
