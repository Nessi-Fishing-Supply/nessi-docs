import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
import { getDomainConfig, DOMAINS } from '@/features/shared/constants/domains';
import { getDomainJourneys, DomainJourneyList } from '@/features/journeys';

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

  const result = getDomainJourneys(branch, domain);
  if (!result) notFound();

  return (
    <DomainJourneyList
      domain={result.config}
      journeys={result.journeys}
      stats={result.stats}
      siblingDomains={result.siblingDomains}
    />
  );
}
