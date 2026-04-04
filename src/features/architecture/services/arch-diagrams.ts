import { loadBranch } from '@/data/branch-loader';
import type { ArchDiagram } from '@/types/architecture';

export interface ArchDiagramPageData {
  diagram: ArchDiagram;
  siblings: { slug: string; title: string; description: string }[];
}

export function getArchDiagrams(branch: string): ArchDiagram[] {
  const data = loadBranch(branch);
  return data?.archDiagrams ?? [];
}

export function getArchDiagram(branch: string, slug: string): ArchDiagramPageData | null {
  const data = loadBranch(branch);
  if (!data) return null;

  const diagram = data.archDiagrams.find((d) => d.slug === slug);
  if (!diagram) return null;

  const siblings = data.archDiagrams.map((d) => ({
    slug: d.slug,
    title: d.title,
    description: d.description,
  }));

  return { diagram, siblings };
}
