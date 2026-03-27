import { notFound } from 'next/navigation';
import {
  getFeatureDomains,
  getFeaturesByDomain,
  getChangelogByDomain,
  getAllJourneys,
  entities,
} from '@/data';
import { FeatureDomainView } from '@/features/feature-domain/feature-domain-view';

export function generateStaticParams() {
  return getFeatureDomains().map((d) => ({ domain: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }) {
  const { domain: slug } = await params;
  const domains = getFeatureDomains();
  const domain = domains.find((d) => d.slug === slug);
  return { title: domain ? `${domain.label} | Nessi Docs` : 'Feature' };
}

export default async function FeatureDomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: slug } = await params;
  const domains = getFeatureDomains();
  const domain = domains.find((d) => d.slug === slug);
  if (!domain) notFound();

  const domainFeatures = getFeaturesByDomain(slug);
  const domainChangelog = getChangelogByDomain(slug);
  const allJourneys = getAllJourneys();
  const domainJourneys = allJourneys
    .filter((j) => j.domain === slug)
    .map((j) => ({ slug: j.slug, title: j.title, domain: j.domain }));

  const entityNames = new Set(
    domainFeatures.flatMap((f) => (f as unknown as { entities?: string[] }).entities ?? []),
  );
  const domainEntities = entities
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
