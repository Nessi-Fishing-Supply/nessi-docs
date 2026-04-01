import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
import { DOMAINS } from '@/constants/domains';
import { JourneyPageClient } from './client';

export function generateStaticParams() {
  return getBranchNames().flatMap((branch) => {
    const data = loadBranch(branch);
    if (!data) return [];
    return DOMAINS.flatMap((d) =>
      data.journeys
        .filter((j) => j.domain === d.slug)
        .map((j) => ({ branch, domain: d.slug, slug: j.slug })),
    );
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ branch: string; domain: string; slug: string }>;
}) {
  const { branch, domain, slug } = await params;
  const data = loadBranch(branch);
  const journey = data?.journeys.find((j) => j.domain === domain && j.slug === slug);
  return { title: journey?.title ?? 'Journey' };
}

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ branch: string; domain: string; slug: string }>;
}) {
  const { branch, domain, slug } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const journey = data.journeys.find((j) => j.domain === domain && j.slug === slug);
  if (!journey) notFound();

  const siblings = data.journeys
    .filter((j) => j.domain === domain)
    .map((j) => ({
      slug: j.slug,
      title: j.title,
      description: j.description,
    }));

  return <JourneyPageClient journey={journey} domain={domain} siblings={siblings} />;
}
