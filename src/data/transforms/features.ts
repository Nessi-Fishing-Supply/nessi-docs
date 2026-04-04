import type { Feature } from '@/features/feature-domain';
import type { ApiGroup } from '@/features/api-map';
import type { FeatureDomain, DashboardMetrics } from '@/types/dashboard';
import type { ChangelogEntry } from '@/types/changelog';
import type { RawJourney, RawLifecycle, RawEntity } from '../raw-types';
import { DOMAINS } from '@/constants/domains';
import { transformChangelog } from './changelog';

/* ------------------------------------------------------------------ */
/*  Feature Domain Mapping                                             */
/*  Map feature slugs → domain slugs for dashboard grouping            */
/* ------------------------------------------------------------------ */

export const FEATURE_TO_DOMAIN: Record<string, string> = {
  addresses: 'account',
  auth: 'auth',
  blocks: 'messaging',
  cart: 'cart',
  context: 'auth',
  dashboard: 'account',
  editorial: 'listings',
  email: 'shops',
  flags: 'shopping',
  follows: 'shopping',
  listings: 'listings',
  members: 'account',
  messaging: 'messaging',
  orders: 'cart',
  'recently-viewed': 'shopping',
  shared: 'shopping',
  shops: 'shops',
  watchlist: 'shopping',
};

const SCOPE_TO_DOMAIN: Record<string, string> = {
  auth: 'auth',
  onboarding: 'auth',
  context: 'auth',
  cart: 'cart',
  checkout: 'cart',
  orders: 'cart',
  shops: 'shops',
  shop: 'shops',
  invites: 'shops',
  email: 'shops',
  listings: 'listings',
  listing: 'listings',
  editorial: 'listings',
  follows: 'shopping',
  search: 'shopping',
  recently: 'shopping',
  'recently-viewed': 'shopping',
  reports: 'shopping',
  flags: 'shopping',
  recommendations: 'shopping',
  watchlist: 'shopping',
  blocks: 'messaging',
  messaging: 'messaging',
  offers: 'messaging',
  account: 'account',
  addresses: 'account',
  members: 'account',
  profiles: 'account',
  dashboard: 'account',
};

/** A feature with no components, endpoints, or entities is a utility — not a product feature. */
function hasProductSurface(f: Feature): boolean {
  const entities = (f as unknown as { entities?: string[] }).entities ?? [];
  return f.componentCount > 0 || f.endpointCount > 0 || entities.length > 0;
}

export function getFeatureDomains(
  allFeatures: Feature[],
  allJourneys: RawJourney[],
): FeatureDomain[] {
  return DOMAINS.map((d) => {
    const domainFeatures = allFeatures
      .filter((f) => FEATURE_TO_DOMAIN[f.slug] === d.slug)
      .filter(hasProductSurface);
    if (domainFeatures.length === 0) return null;

    const endpointCount = domainFeatures.reduce((sum, f) => sum + f.endpointCount, 0);
    const journeyCount = allJourneys.filter((j) => j.domain === d.slug).length;
    const entityCount = domainFeatures.reduce((sum, f) => {
      const entities = (f as unknown as { entities?: string[] }).entities ?? [];
      return sum + entities.length;
    }, 0);

    return {
      slug: d.slug,
      label: d.label,
      description: d.description,
      featureCount: domainFeatures.length,
      endpointCount,
      journeyCount,
      entityCount,
    } satisfies FeatureDomain;
  }).filter((d): d is FeatureDomain => d !== null);
}

export function getFeaturesByDomain(allFeatures: Feature[], domain: string): Feature[] {
  return allFeatures.filter((f) => FEATURE_TO_DOMAIN[f.slug] === domain).filter(hasProductSurface);
}

export function getDomainForScope(scope: string): string | undefined {
  return SCOPE_TO_DOMAIN[scope.toLowerCase()];
}

export function getChangelogByDomain(
  rawChangelog: {
    title?: string;
    mergedAt?: string;
    type?: string;
    area?: string;
    number?: number;
    url?: string;
  }[],
  domain: string,
): ChangelogEntry[] {
  const scopeRegex = /^\w+\(([^)]+)\):/;
  const matched = rawChangelog.filter((entry) => {
    const match = (entry.title ?? '').match(scopeRegex);
    if (!match) return false;
    const scope = match[1].toLowerCase();
    return SCOPE_TO_DOMAIN[scope] === domain;
  });

  return transformChangelog(matched);
}

export function getDashboardMetrics(data: {
  features: Feature[];
  apiGroups: ApiGroup[];
  journeys: RawJourney[];
  entities: RawEntity[];
  lifecycles: RawLifecycle[];
}): DashboardMetrics {
  return {
    totalFeatures: data.features.length,
    totalEndpoints: data.apiGroups.reduce((sum, g) => sum + g.endpoints.length, 0),
    totalJourneys: data.journeys.length,
    totalEntities: data.entities.length,
    totalLifecycles: data.lifecycles.length,
  };
}
