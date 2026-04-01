/* ------------------------------------------------------------------ */
/*  Lifecycle cross-link index — lifecycle ↔ entity ↔ journey mapping  */
/*  Functions accept data as params to support multi-branch usage      */
/* ------------------------------------------------------------------ */

import type { Lifecycle } from '@/types/lifecycle';
import type { Journey } from '@/types/journey';
import type { CrossLinkIndex } from './cross-links';

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

export function getLifecycleForEntity(
  lifecycles: Lifecycle[],
  tableName: string,
): LifecycleRef | null {
  for (const lc of lifecycles) {
    const mapped = LIFECYCLE_ENTITY_MAP[lc.slug];
    if (mapped === tableName) {
      return { slug: lc.slug, name: lc.name };
    }
  }
  return null;
}

export function getEntitiesForLifecycle(lifecycles: Lifecycle[], lifecycleSlug: string): string[] {
  // Verify the lifecycle exists
  const lc = lifecycles.find((l) => l.slug === lifecycleSlug);
  if (!lc) return [];

  const tableName = LIFECYCLE_ENTITY_MAP[lifecycleSlug];
  return tableName ? [tableName] : [];
}

/* ------------------------------------------------------------------ */
/*  Lifecycle ↔ Journey mapping (via entity overlap)                   */
/* ------------------------------------------------------------------ */

export function getJourneysForLifecycle(
  journeys: Journey[],
  lifecycles: Lifecycle[],
  crossLinkIndex: CrossLinkIndex,
  lifecycleSlug: string,
): JourneyRef[] {
  // Build entity → lifecycle index
  const entityToLifecycle = new Map<string, LifecycleRef>();
  for (const lc of lifecycles) {
    const tableName = LIFECYCLE_ENTITY_MAP[lc.slug];
    if (tableName) {
      entityToLifecycle.set(tableName, { slug: lc.slug, name: lc.name });
    }
  }

  const governedTables = new Set(entityToLifecycle.keys());
  const result: JourneyRef[] = [];

  for (const journey of journeys) {
    let found = false;

    for (const node of journey.nodes) {
      if (found) break;
      if (node.type !== 'step' || !node.route) continue;

      const spaceIdx = node.route.indexOf(' ');
      if (spaceIdx < 0) continue;
      const method = node.route.slice(0, spaceIdx);
      const path = node.route.slice(spaceIdx + 1);

      const tables = crossLinkIndex.getTablesForEndpoint(method, path);
      for (const table of tables) {
        if (governedTables.has(table.name)) {
          const lcRef = entityToLifecycle.get(table.name)!;
          if (lcRef.slug === lifecycleSlug) {
            result.push({ slug: journey.slug, domain: journey.domain, title: journey.title });
            found = true;
            break;
          }
        }
      }
    }
  }

  return result;
}

export function getLifecyclesForJourney(
  journeys: Journey[],
  lifecycles: Lifecycle[],
  crossLinkIndex: CrossLinkIndex,
  journeySlug: string,
): LifecycleRef[] {
  const journey = journeys.find((j) => j.slug === journeySlug);
  if (!journey) return [];

  // Build entity → lifecycle index
  const entityToLifecycle = new Map<string, LifecycleRef>();
  for (const lc of lifecycles) {
    const tableName = LIFECYCLE_ENTITY_MAP[lc.slug];
    if (tableName) {
      entityToLifecycle.set(tableName, { slug: lc.slug, name: lc.name });
    }
  }

  const governedTables = new Set(entityToLifecycle.keys());
  const seen = new Set<string>();
  const result: LifecycleRef[] = [];

  for (const node of journey.nodes) {
    if (node.type !== 'step' || !node.route) continue;

    const spaceIdx = node.route.indexOf(' ');
    if (spaceIdx < 0) continue;
    const method = node.route.slice(0, spaceIdx);
    const path = node.route.slice(spaceIdx + 1);

    const tables = crossLinkIndex.getTablesForEndpoint(method, path);
    for (const table of tables) {
      if (governedTables.has(table.name)) {
        const lcRef = entityToLifecycle.get(table.name)!;
        if (!seen.has(lcRef.slug)) {
          seen.add(lcRef.slug);
          result.push(lcRef);
        }
      }
    }
  }

  return result;
}

export function getLifecyclesForRoute(
  lifecycles: Lifecycle[],
  crossLinkIndex: CrossLinkIndex,
  route: string,
): LifecycleRef[] {
  const spaceIdx = route.indexOf(' ');
  if (spaceIdx < 0) return [];
  const method = route.slice(0, spaceIdx);
  const path = route.slice(spaceIdx + 1);

  // Build entity → lifecycle index
  const entityToLifecycle = new Map<string, LifecycleRef>();
  for (const lc of lifecycles) {
    const tableName = LIFECYCLE_ENTITY_MAP[lc.slug];
    if (tableName) {
      entityToLifecycle.set(tableName, { slug: lc.slug, name: lc.name });
    }
  }

  const tables = crossLinkIndex.getTablesForEndpoint(method, path);
  const result: LifecycleRef[] = [];
  const seen = new Set<string>();

  for (const table of tables) {
    const lc = entityToLifecycle.get(table.name);
    if (lc && !seen.has(lc.slug)) {
      seen.add(lc.slug);
      result.push(lc);
    }
  }
  return result;
}
