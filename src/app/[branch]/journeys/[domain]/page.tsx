import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
import { getDomainConfig, DOMAINS } from '@/constants/domains';
import { DomainJourneyList } from '@/features/journeys/domain-journey-list';

export function generateStaticParams() {
  return getBranchNames().flatMap((branch) => {
    const data = loadBranch(branch);
    if (!data) return [];
    const activeDomains = DOMAINS.filter((d) => data.journeys.some((j) => j.domain === d.slug));
    return activeDomains.map((d) => ({ branch, domain: d.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ branch: string; domain: string }>;
}) {
  const { domain } = await params;
  const config = getDomainConfig(domain);
  return { title: config?.label ?? 'Journeys' };
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ branch: string; domain: string }>;
}) {
  const { branch, domain } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const config = getDomainConfig(domain);
  if (!config) notFound();

  const journeys = data.journeys.filter((j) => j.domain === domain);
  const allSteps = journeys.flatMap((j) => j.nodes.filter((n) => n.type === 'step'));

  const allDomains = DOMAINS.filter((d) => data.journeys.some((j) => j.domain === d.slug)).map(
    (d) => ({ slug: d.slug, label: d.label }),
  );

  return (
    <DomainJourneyList
      domain={config}
      journeys={journeys}
      stats={{ stepCount: allSteps.length }}
      siblingDomains={allDomains}
    />
  );
}
