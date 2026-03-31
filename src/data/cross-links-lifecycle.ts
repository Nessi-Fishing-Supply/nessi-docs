/* ------------------------------------------------------------------ */
/*  Lifecycle cross-link index — lifecycle ↔ entity ↔ journey mapping  */
/*  Computed once at import time from raw + transformed data           */
/* ------------------------------------------------------------------ */

/*
 * NOTE: We import raw data + transform functions directly (not from
 * @/data/index) to avoid circular imports, since index.ts re-exports
 * from this module.
 */

import type { Lifecycle } from '@/types/lifecycle';
import type { Journey } from '@/types/journey';
import type { RawLifecycle, RawJourney } from './raw-types';

import lifecyclesRaw from './generated/lifecycles.json';
import journeysRaw from './generated/journeys.json';
import { transformLifecycles } from './layout/lifecycle-layout';
import { transformJourneys } from './layout/journey-layout';
import { getTablesForEndpoint } from './cross-links';

/* ------------------------------------------------------------------ */
/*  Local data (avoid circular import with index.ts)                   */
/* ------------------------------------------------------------------ */

const _lifecycles: Lifecycle[] = transformLifecycles(lifecyclesRaw.lifecycles as RawLifecycle[]);
const _journeys: Journey[] = transformJourneys(journeysRaw.journeys as unknown as RawJourney[]);

/* ------------------------------------------------------------------ */
/*  Lifecycle ↔ Entity mapping                                        */
/* ------------------------------------------------------------------ */

/** Explicit map: lifecycle slug → entity table name. */
const LIFECYCLE_ENTITY_MAP: Record<string, string> = {
  listing: 'listings',
  invite: 'shop_invites',
  flag: 'flags',
  member: 'members',
  shop: 'shops',
  thread: 'message_threads',
  offer: 'offers',
  ownership_transfers: 'shop_ownership_transfers',
  // subscription: no matching table yet
};

interface LifecycleRef {
  slug: string;
  name: string;
}

interface JourneyRef {
  slug: string;
  domain: string;
  title: string;
}

// Build entity → lifecycle index
const _entityToLifecycle = new Map<string, LifecycleRef>();
const _lifecycleToEntities = new Map<string, string[]>();

for (const lc of _lifecycles) {
  const tableName = LIFECYCLE_ENTITY_MAP[lc.slug];
  if (!tableName) continue;

  _entityToLifecycle.set(tableName, { slug: lc.slug, name: lc.name });

  const existing = _lifecycleToEntities.get(lc.slug) ?? [];
  existing.push(tableName);
  _lifecycleToEntities.set(lc.slug, existing);
}

export function getLifecycleForEntity(tableName: string): LifecycleRef | null {
  return _entityToLifecycle.get(tableName) ?? null;
}

export function getEntitiesForLifecycle(lifecycleSlug: string): string[] {
  return _lifecycleToEntities.get(lifecycleSlug) ?? [];
}

/* ------------------------------------------------------------------ */
/*  Lifecycle ↔ Journey mapping (via entity overlap)                   */
/* ------------------------------------------------------------------ */

const _lifecycleToJourneys = new Map<string, JourneyRef[]>();
const _journeyToLifecycles = new Map<string, LifecycleRef[]>();

// Set of lifecycle-governed table names for quick lookup
const governedTables = new Set(_entityToLifecycle.keys());

for (const journey of _journeys) {
  const journeyLifecycles = new Set<string>();

  for (const node of journey.nodes) {
    if (node.type !== 'step' || !node.route) continue;

    // Parse "METHOD /path" from route
    const spaceIdx = node.route.indexOf(' ');
    if (spaceIdx < 0) continue;
    const method = node.route.slice(0, spaceIdx);
    const path = node.route.slice(spaceIdx + 1);

    const tables = getTablesForEndpoint(method, path);
    for (const table of tables) {
      if (governedTables.has(table.name)) {
        const lcRef = _entityToLifecycle.get(table.name)!;
        journeyLifecycles.add(lcRef.slug);
      }
    }
  }

  if (journeyLifecycles.size > 0) {
    const jRef: JourneyRef = { slug: journey.slug, domain: journey.domain, title: journey.title };
    const lcRefs: LifecycleRef[] = [];

    for (const lcSlug of journeyLifecycles) {
      // Add journey to lifecycle's list
      const existing = _lifecycleToJourneys.get(lcSlug) ?? [];
      existing.push(jRef);
      _lifecycleToJourneys.set(lcSlug, existing);

      // Collect lifecycle refs for this journey
      const lc = _lifecycles.find((l) => l.slug === lcSlug);
      if (lc) lcRefs.push({ slug: lc.slug, name: lc.name });
    }

    _journeyToLifecycles.set(journey.slug, lcRefs);
  }
}

export function getJourneysForLifecycle(lifecycleSlug: string): JourneyRef[] {
  return _lifecycleToJourneys.get(lifecycleSlug) ?? [];
}

export function getLifecyclesForJourney(journeySlug: string): LifecycleRef[] {
  return _journeyToLifecycles.get(journeySlug) ?? [];
}

export function getLifecyclesForRoute(route: string): LifecycleRef[] {
  const spaceIdx = route.indexOf(' ');
  if (spaceIdx < 0) return [];
  const method = route.slice(0, spaceIdx);
  const path = route.slice(spaceIdx + 1);

  const tables = getTablesForEndpoint(method, path);
  const result: LifecycleRef[] = [];
  const seen = new Set<string>();

  for (const table of tables) {
    const lc = _entityToLifecycle.get(table.name);
    if (lc && !seen.has(lc.slug)) {
      seen.add(lc.slug);
      result.push(lc);
    }
  }
  return result;
}
