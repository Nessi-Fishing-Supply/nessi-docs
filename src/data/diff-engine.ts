// src/data/diff-engine.ts

import type { BranchData } from '@/features/shared/types/branch';
import type { ApiEndpoint, ApiGroup } from '@/features/api-map';
import type {
  DiffSet,
  DiffResult,
  DiffSummary,
  DiffStatus,
  FieldChange,
  ModifiedItem,
  ApiGroupDiff,
} from '@/features/diff-overview/types/diff';

/**
 * Shallow field comparison: compare top-level properties via JSON.stringify.
 */
function diffFields(base: object, head: object): FieldChange[] {
  const changes: FieldChange[] = [];
  const b = base as Record<string, unknown>;
  const h = head as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(b), ...Object.keys(h)]);

  for (const field of allKeys) {
    const baseVal = b[field];
    const headVal = h[field];
    if (JSON.stringify(baseVal) !== JSON.stringify(headVal)) {
      changes.push({ field, baseValue: baseVal, headValue: headVal });
    }
  }

  return changes;
}

/**
 * Compare two arrays by a stable key. Produces added/removed/modified/unchanged
 * buckets plus a statusMap for O(1) lookup.
 */
function diffSet<T>(baseItems: T[], headItems: T[], getKey: (item: T) => string): DiffSet<T> {
  const baseMap = new Map<string, T>();
  for (const item of baseItems) baseMap.set(getKey(item), item);

  const headMap = new Map<string, T>();
  for (const item of headItems) headMap.set(getKey(item), item);

  const added: T[] = [];
  const removed: T[] = [];
  const modified: ModifiedItem<T>[] = [];
  const unchanged: T[] = [];
  const statusMap = new Map<string, DiffStatus>();

  // Check head items against base
  for (const [key, headItem] of headMap) {
    const baseItem = baseMap.get(key);
    if (!baseItem) {
      added.push(headItem);
      statusMap.set(key, 'added');
    } else {
      const changes = diffFields(baseItem as object, headItem as object);
      if (changes.length > 0) {
        modified.push({ base: baseItem, head: headItem, changes });
        statusMap.set(key, 'modified');
      } else {
        unchanged.push(headItem);
        statusMap.set(key, 'unchanged');
      }
    }
  }

  // Items only in base are removed
  for (const [key, baseItem] of baseMap) {
    if (!headMap.has(key)) {
      removed.push(baseItem);
      statusMap.set(key, 'removed');
    }
  }

  return { added, removed, modified, unchanged, statusMap };
}

/**
 * Diff API endpoints within a matched group pair.
 */
function diffEndpoints(
  baseEndpoints: ApiEndpoint[],
  headEndpoints: ApiEndpoint[],
): ApiGroupDiff['endpointDiffs'] {
  const getKey = (ep: ApiEndpoint) => `${ep.method}:${ep.path}`;
  const baseMap = new Map<string, ApiEndpoint>();
  for (const ep of baseEndpoints) baseMap.set(getKey(ep), ep);
  const headMap = new Map<string, ApiEndpoint>();
  for (const ep of headEndpoints) headMap.set(getKey(ep), ep);

  const added: ApiEndpoint[] = [];
  const removed: ApiEndpoint[] = [];
  const modified: { base: ApiEndpoint; head: ApiEndpoint; changes: FieldChange[] }[] = [];
  const unchanged: ApiEndpoint[] = [];

  for (const [key, headEp] of headMap) {
    const baseEp = baseMap.get(key);
    if (!baseEp) {
      added.push(headEp);
    } else {
      const changes = diffFields(baseEp, headEp);
      if (changes.length > 0) {
        modified.push({ base: baseEp, head: headEp, changes });
      } else {
        unchanged.push(headEp);
      }
    }
  }

  for (const [key, baseEp] of baseMap) {
    if (!headMap.has(key)) removed.push(baseEp);
  }

  return { added, removed, modified, unchanged };
}

/**
 * Build per-group diffs for API groups, including endpoint-level diffing.
 */
function diffApiGroups(baseGroups: ApiGroup[], headGroups: ApiGroup[]): ApiGroupDiff[] {
  const baseMap = new Map<string, ApiGroup>();
  for (const g of baseGroups) baseMap.set(g.name, g);
  const headMap = new Map<string, ApiGroup>();
  for (const g of headGroups) headMap.set(g.name, g);

  const result: ApiGroupDiff[] = [];

  for (const [name, headGroup] of headMap) {
    const baseGroup = baseMap.get(name);
    if (!baseGroup) {
      result.push({
        group: headGroup,
        status: 'added',
        endpointDiffs: {
          added: headGroup.endpoints,
          removed: [],
          modified: [],
          unchanged: [],
        },
      });
    } else {
      const endpointDiffs = diffEndpoints(baseGroup.endpoints, headGroup.endpoints);
      const hasChanges =
        endpointDiffs.added.length > 0 ||
        endpointDiffs.removed.length > 0 ||
        endpointDiffs.modified.length > 0;
      result.push({
        group: headGroup,
        status: hasChanges ? 'modified' : 'unchanged',
        endpointDiffs,
      });
    }
  }

  for (const [name, baseGroup] of baseMap) {
    if (!headMap.has(name)) {
      result.push({
        group: baseGroup,
        status: 'removed',
        endpointDiffs: {
          added: [],
          removed: baseGroup.endpoints,
          modified: [],
          unchanged: [],
        },
      });
    }
  }

  return result;
}

/**
 * Build summary counts from individual DiffSets.
 */
function buildSummary(
  sets: Record<string, { added: unknown[]; removed: unknown[]; modified: unknown[] }>,
): DiffSummary {
  let added = 0;
  let removed = 0;
  let modified = 0;
  const byDomain: DiffSummary['byDomain'] = {};

  for (const [domain, set] of Object.entries(sets)) {
    const a = set.added.length;
    const r = set.removed.length;
    const m = set.modified.length;
    added += a;
    removed += r;
    modified += m;
    if (a > 0 || r > 0 || m > 0) {
      byDomain[domain] = { added: a, removed: r, modified: m };
    }
  }

  return { added, removed, modified, byDomain };
}

/**
 * Compare two BranchData objects and produce a full DiffResult.
 * `base` is what you're comparing against, `head` is what you're viewing.
 */
export function computeDiff(base: BranchData, head: BranchData): DiffResult {
  const entities = diffSet(base.entities, head.entities, (e) => e.name);
  const journeys = diffSet(base.journeys, head.journeys, (j) => j.slug);
  const lifecycles = diffSet(base.lifecycles, head.lifecycles, (l) => l.slug);
  const apiGroups = diffSet(base.apiGroups, head.apiGroups, (g) => g.name);
  const apiGroupDiffs = diffApiGroups(base.apiGroups, head.apiGroups);
  const archDiagrams = diffSet(base.archDiagrams, head.archDiagrams, (d) => d.slug);
  const features = diffSet(base.features, head.features, (f) => f.slug);
  const erdNodes = diffSet(base.erdNodes, head.erdNodes, (n) => n.id);
  const erdEdges = diffSet(base.erdEdges, head.erdEdges, (e) => `${e.from}:${e.to}`);
  const configEnums = diffSet(base.configEnums, head.configEnums, (c) => c.slug);

  const summary = buildSummary({
    entities,
    journeys,
    lifecycles,
    apiGroups,
    archDiagrams,
    features,
    erdNodes,
    erdEdges,
    configEnums,
  });

  return {
    entities,
    journeys,
    lifecycles,
    apiGroups,
    apiGroupDiffs,
    archDiagrams,
    features,
    erdNodes,
    erdEdges,
    configEnums,
    summary,
  };
}
