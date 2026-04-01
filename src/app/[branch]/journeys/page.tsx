import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { DOMAINS } from '@/constants/domains';
import { DomainGrid } from '@/features/journeys/domain-grid';

export default async function JourneysIndex({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const domains = DOMAINS.map((d) => {
    const dJourneys = data.journeys.filter((j) => j.domain === d.slug);
    const allNodes = dJourneys.flatMap((j) => j.nodes);
    const steps = allNodes.filter((n) => n.type === 'step');
    return {
      ...d,
      journeyCount: dJourneys.length,
      stepCount: steps.length,
      decisionCount: allNodes.filter((n) => n.type === 'decision').length,
    };
  }).filter((d) => d.journeyCount > 0);

  return (
    <Suspense>
      <DomainGrid domains={domains} />
    </Suspense>
  );
}
