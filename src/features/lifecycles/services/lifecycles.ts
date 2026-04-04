import { loadBranch } from '@/data/branch-loader';
import { getEntitiesForLifecycle } from '@/data/cross-links-lifecycle';
import type { Lifecycle } from '@/types/lifecycle';

export interface LifecyclePageData {
  lifecycle: Lifecycle;
  siblings: { slug: string; name: string; description: string }[];
  entityNames: string[];
}

export function getLifecycles(branch: string): Lifecycle[] {
  const data = loadBranch(branch);
  return data?.lifecycles ?? [];
}

export function getLifecycle(branch: string, slug: string): LifecyclePageData | null {
  const data = loadBranch(branch);
  if (!data) return null;

  const lifecycle = data.lifecycles.find((l) => l.slug === slug);
  if (!lifecycle) return null;

  const siblings = data.lifecycles.map((l) => ({
    slug: l.slug,
    name: l.name,
    description: l.description,
  }));

  const entityNames = getEntitiesForLifecycle(data.lifecycles, slug);

  return { lifecycle, siblings, entityNames };
}
