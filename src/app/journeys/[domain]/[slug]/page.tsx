import { notFound } from 'next/navigation';
import { getDomains, getJourneysByDomain, getJourney } from '@/data';
import { JourneyPageClient } from './client';

export function generateStaticParams() {
  return getDomains().flatMap((d) =>
    getJourneysByDomain(d.slug).map((j) => ({ domain: d.slug, slug: j.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string; slug: string }>;
}) {
  const { domain, slug } = await params;
  const journey = getJourney(domain, slug);
  return { title: journey?.title ?? 'Journey' };
}

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ domain: string; slug: string }>;
}) {
  const { domain, slug } = await params;
  const journey = getJourney(domain, slug);
  if (!journey) notFound();
  return <JourneyPageClient journey={journey} domain={domain} />;
}
