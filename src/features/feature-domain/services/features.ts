import { loadBranch } from '@/data/branch-loader';
import type { Feature } from '../types/feature';
import type { FeatureDomain } from '@/features/dashboard/types/dashboard';
import type { ChangelogEntry } from '@/features/changelog/types/changelog';
import type { RawJourney } from '@/data/raw-types';
import {
  getFeatureDomains as _getFeatureDomains,
  getFeaturesByDomain,
  getChangelogByDomain,
} from '@/data/transforms/features';

export interface FeatureDomainPageData {
  domain: FeatureDomain;
  features: Feature[];
  changelog: ChangelogEntry[];
  journeys: { slug: string; title: string; domain: string }[];
  entities: { name: string; label: string; fieldCount: number }[];
}

export function getFeatureDomains(branch: string): FeatureDomain[] {
  const data = loadBranch(branch);
  if (!data) return [];
  return _getFeatureDomains(data.features, data.journeys as unknown as RawJourney[]);
}

export function getFeatureDomainPageData(
  branch: string,
  slug: string,
): FeatureDomainPageData | null {
  const data = loadBranch(branch);
  if (!data) return null;

  const domains = _getFeatureDomains(data.features, data.journeys as unknown as RawJourney[]);
  const domain = domains.find((d) => d.slug === slug);
  if (!domain) return null;

  const features = getFeaturesByDomain(data.features, slug);
  const changelog = getChangelogByDomain(data.rawChangelog, slug);
  const journeys = data.journeys
    .filter((j) => j.domain === slug)
    .map((j) => ({ slug: j.slug, title: j.title, domain: j.domain }));

  const entityNames = new Set(
    features.flatMap((f) => (f as unknown as { entities?: string[] }).entities ?? []),
  );
  const entities = data.entities
    .filter((e) => entityNames.has(e.name))
    .map((e) => ({ name: e.name, label: e.label ?? e.name, fieldCount: e.fields.length }));

  return { domain, features, changelog, journeys, entities };
}
