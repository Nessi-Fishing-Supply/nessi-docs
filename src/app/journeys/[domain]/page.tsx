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

  const allDomains = getDomains().map((d) => ({
    slug: d.slug,
    label: d.label,
  }));

  return (
    <DomainJourneyList
      domain={config}
      journeys={journeys}
      stats={{ stepCount: allSteps.length }}
      siblingDomains={allDomains}
    />
  );
}
