import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
import {
  getFeatureDomains,
  getFeaturesByDomain,
  getChangelogByDomain,
} from '@/data/transforms/features';
import type { RawJourney } from '@/data/raw-types';
import { FeatureDomainView } from '@/features/feature-domain/feature-domain-view';

export function generateStaticParams() {
  return getBranchNames().flatMap((branch) => {
    const data = loadBranch(branch);
    if (!data) return [];
    const domains = getFeatureDomains(data.features, data.journeys as unknown as RawJourney[]);
    return domains.map((d) => ({ branch, domain: d.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ branch: string; domain: string }>;
}) {
  const { branch, domain: slug } = await params;
  const data = loadBranch(branch);
  if (!data) return { title: 'Feature' };
  const domains = getFeatureDomains(data.features, data.journeys as unknown as RawJourney[]);
  const domain = domains.find((d) => d.slug === slug);
  return { title: domain ? `${domain.label} | Nessi Docs` : 'Feature' };
}

export default async function FeatureDomainPage({
  params,
}: {
  params: Promise<{ branch: string; domain: string }>;
}) {
  const { branch, domain: slug } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const domains = getFeatureDomains(data.features, data.journeys as unknown as RawJourney[]);
  const domain = domains.find((d) => d.slug === slug);
  if (!domain) notFound();

  const domainFeatures = getFeaturesByDomain(data.features, slug);
  const domainChangelog = getChangelogByDomain(data.rawChangelog, slug);
  const domainJourneys = data.journeys
    .filter((j) => j.domain === slug)
    .map((j) => ({ slug: j.slug, title: j.title, domain: j.domain }));

  const entityNames = new Set(
    domainFeatures.flatMap((f) => (f as unknown as { entities?: string[] }).entities ?? []),
  );
  const domainEntities = data.entities
    .filter((e) => entityNames.has(e.name))
    .map((e) => ({ name: e.name, label: e.label, fieldCount: e.fields.length }));

  return (
    <FeatureDomainView
      domain={domain}
      features={domainFeatures}
      changelog={domainChangelog}
      journeys={domainJourneys}
      entities={domainEntities}
    />
  );
}
