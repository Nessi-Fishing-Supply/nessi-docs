import { notFound } from 'next/navigation';
import { getDomains, getJourneysByDomain } from '@/data';
import { getDomainConfig } from '@/constants/domains';
import { DomainJourneyList } from '@/features/journeys/domain-journey-list';

export function generateStaticParams() {
  return getDomains().map((d) => ({ domain: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const config = getDomainConfig(domain);
  return { title: config?.label ?? 'Journeys' };
}

export default async function DomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const config = getDomainConfig(domain);
  if (!config) notFound();

  const journeys = getJourneysByDomain(domain);
  const allSteps = journeys.flatMap((j) => j.nodes.filter((n) => n.type === 'step'));
  const built = allSteps.filter((s) => s.status === 'built' || s.status === 'tested').length;
  const builtPercent = allSteps.length > 0 ? Math.round((built / allSteps.length) * 100) : 0;

  return (
    <DomainJourneyList
      domain={config}
      journeys={journeys}
      stats={{ stepCount: allSteps.length, builtPercent }}
    />
  );
}
