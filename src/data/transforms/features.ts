import type { Feature } from '@/types/feature';
import type { ApiGroup } from '@/types/api-contract';
import type { FeatureDomain, DashboardMetrics } from '@/types/dashboard';
import type { ChangelogEntry } from '@/types/changelog';
import type { RawJourney, RawLifecycle, RawEntity } from '../raw-types';
import { DOMAINS } from '@/constants/domains';
import { transformChangelog } from './changelog';

import apiContractsRaw from '../generated/api-contracts.json';
import featuresRaw from '../generated/features.json';
import journeysRaw from '../generated/journeys.json';
import dataModelRaw from '../generated/data-model.json';
import lifecyclesRaw from '../generated/lifecycles.json';
import changelogRaw from '../generated/changelog.json';

/* ------------------------------------------------------------------ */
/*  Feature Domain Mapping                                             */
/*  Map feature slugs → domain slugs for dashboard grouping            */
/* ------------------------------------------------------------------ */

const FEATURE_TO_DOMAIN: Record<string, string> = {
  addresses: 'account',
  auth: 'auth',
  blocks: 'shopping',
  cart: 'cart',
  context: 'auth',
  dashboard: 'account',
  editorial: 'listings',
  email: 'shops',
  flags: 'shopping',
  follows: 'shopping',
  listings: 'listings',
  members: 'account',
  messaging: 'shopping',
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
  blocks: 'shopping',
  messaging: 'shopping',
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

export function getFeatureDomains(): FeatureDomain[] {
  const allFeatures = featuresRaw.features as unknown as Feature[];
  const allJourneys = journeysRaw.journeys as unknown as RawJourney[];

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

export function getFeaturesByDomain(domain: string): Feature[] {
  const allFeatures = featuresRaw.features as unknown as Feature[];
  return allFeatures.filter((f) => FEATURE_TO_DOMAIN[f.slug] === domain).filter(hasProductSurface);
}

export function getDomainForScope(scope: string): string | undefined {
  return SCOPE_TO_DOMAIN[scope.toLowerCase()];
}

export function getChangelogByDomain(domain: string): ChangelogEntry[] {
  const raw = changelogRaw.entries as {
    title?: string;
    mergedAt?: string;
    type?: string;
    area?: string;
    number?: number;
    url?: string;
  }[];

  const scopeRegex = /^\w+\(([^)]+)\):/;
  const matched = raw.filter((entry) => {
    const match = (entry.title ?? '').match(scopeRegex);
    if (!match) return false;
    const scope = match[1].toLowerCase();
    return SCOPE_TO_DOMAIN[scope] === domain;
  });

  return transformChangelog(matched);
}

export function getDashboardMetrics(): DashboardMetrics {
  const allFeatures = featuresRaw.features as unknown as Feature[];
  const allJourneys = journeysRaw.journeys as unknown as RawJourney[];

  return {
    totalFeatures: allFeatures.length,
    totalEndpoints: (apiContractsRaw.groups as unknown as ApiGroup[]).reduce(
      (sum, g) => sum + g.endpoints.length,
      0,
    ),
    totalJourneys: allJourneys.length,
    totalEntities: (dataModelRaw.entities as RawEntity[]).length,
    totalLifecycles: (lifecyclesRaw.lifecycles as RawLifecycle[]).length,
  };
}
