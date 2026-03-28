import { notFound } from 'next/navigation';
import { getLifecycle, getLifecycleSlugs, getAllLifecycles } from '@/data';
import { LifecyclePageClient } from './client';

export function generateStaticParams() {
  return getLifecycleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lc = getLifecycle(slug);
  return { title: lc ? lc.name : 'Lifecycle' };
}

export default async function LifecyclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lifecycle = getLifecycle(slug);
  if (!lifecycle) notFound();
  const siblings = getAllLifecycles().map((l) => ({
    slug: l.slug,
    name: l.name,
    description: l.description,
  }));
  return <LifecyclePageClient lifecycle={lifecycle} siblings={siblings} />;
}
