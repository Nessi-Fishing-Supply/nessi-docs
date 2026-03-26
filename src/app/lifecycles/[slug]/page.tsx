import { notFound } from 'next/navigation';
import { getLifecycle, getLifecycleSlugs } from '@/data';
import { LifecycleCanvas } from '@/features/lifecycles/lifecycle-canvas';

export function generateStaticParams() {
  return getLifecycleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lc = getLifecycle(slug);
  return { title: lc ? lc.name : 'Lifecycle' };
}

export default async function LifecyclePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lifecycle = getLifecycle(slug);
  if (!lifecycle) notFound();
  return <LifecycleCanvas lifecycle={lifecycle} />;
}
