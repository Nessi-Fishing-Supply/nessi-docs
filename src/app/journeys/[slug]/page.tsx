import { notFound } from 'next/navigation';
import { getJourney, getJourneySlugs } from '@/data';
import { JourneyPageClient } from './client';

export function generateStaticParams() {
  return getJourneySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journey = getJourney(slug);
  return { title: journey?.title ?? 'Journey' };
}

export default async function JourneyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journey = getJourney(slug);
  if (!journey) notFound();
  return <JourneyPageClient journey={journey} />;
}
