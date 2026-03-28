import { notFound } from 'next/navigation';
import { getArchDiagram, getArchDiagramSlugs, getAllArchDiagrams } from '@/data';
import { ArchitecturePageClient } from './client';

export function generateStaticParams() {
  return getArchDiagramSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const diagram = getArchDiagram(slug);
  return { title: diagram ? diagram.title : 'Architecture' };
}

export default async function ArchitecturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const diagram = getArchDiagram(slug);
  if (!diagram) notFound();
  const siblings = getAllArchDiagrams().map((d) => ({
    slug: d.slug,
    title: d.title,
    description: d.description,
  }));
  return <ArchitecturePageClient diagram={diagram} siblings={siblings} />;
}
