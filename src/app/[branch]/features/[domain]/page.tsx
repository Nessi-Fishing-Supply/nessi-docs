import { notFound } from 'next/navigation';
import { getBranchNames } from '@/data/branch-registry';
import { getFeatureDomains, getFeatureDomainPageData } from '@/features/domains';
import { FeatureDomainView } from '@/features/domains/components/feature-domain-view';

export function generateStaticParams() {
  return getBranchNames().flatMap((branch) => {
    const domains = getFeatureDomains(branch);
    return domains.map((d) => ({ branch, domain: d.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ branch: string; domain: string }>;
}) {
  const { branch, domain: slug } = await params;
  const domains = getFeatureDomains(branch);
  const domain = domains.find((d) => d.slug === slug);
  return { title: domain ? `${domain.label} | Nessi Docs` : 'Feature' };
}

export default async function FeatureDomainPage({
  params,
}: {
  params: Promise<{ branch: string; domain: string }>;
}) {
  const { branch, domain: slug } = await params;
  const pageData = getFeatureDomainPageData(branch, slug);
  if (!pageData) notFound();

  return (
    <FeatureDomainView
      domain={pageData.domain}
      features={pageData.features}
      changelog={pageData.changelog}
      journeys={pageData.journeys}
      entities={pageData.entities}
    />
  );
}
