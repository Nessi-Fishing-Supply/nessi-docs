/* ------------------------------------------------------------------ */
/*  Cross-link index — bidirectional table ↔ endpoint mapping         */
/*  Computed once at import time from raw JSON sources                 */
/* ------------------------------------------------------------------ */

import apiContractsRaw from './generated/api-contracts.json';
import dataModelRaw from './generated/data-model.json';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface EndpointRef {
  method: string;
  path: string;
  group: string;
  /** Deep-link slug matching API Map's EndpointRow format */
  anchor: string;
}

export interface TableRef {
  name: string;
  label?: string;
  badge?: string;
}

/* ------------------------------------------------------------------ */
/*  Internal raw-shape types (mirrors generated JSON)                  */
/* ------------------------------------------------------------------ */

interface RawEndpoint {
  method: string;
  path: string;
}

interface RawGroup {
  name: string;
  endpoints: RawEndpoint[];
}

interface RawEntity {
  name: string;
  label?: string;
  badge?: string;
}

/* ------------------------------------------------------------------ */
/*  Anchor generation — must match API Map's EndpointRow format        */
/* ------------------------------------------------------------------ */

function makeAnchor(method: string, path: string): string {
  return `${method.toLowerCase()}-${path.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '')}`;
}

/* ------------------------------------------------------------------ */
/*  Ignored terminal segments (action/verb words, not resource names)  */
/* ------------------------------------------------------------------ */

const IGNORED_SEGMENTS = new Set([
  'merge',
  'validate',
  'search',
  'count',
  'check',
  'view',
  'duplicate',
  'accept',
  'resend',
  'toggle-seller',
  'autocomplete',
  'batch',
  'drafts',
  'recommendations',
  'default',
  'expiry',
  'status',
  'avatar',
  'hero-banner',
  'slug',
  'callback',
  'register',
  'check-email',
  'delete-account',
  'seller-preconditions',
  'seller',
  'search-suggestions',
  'role',
  'delete',
]);

/* ------------------------------------------------------------------ */
/*  Special overrides: path vocabulary → table name                    */
/* ------------------------------------------------------------------ */

const PATH_OVERRIDES: Record<string, string[]> = {
  auth: ['members'],
  upload: ['listing_photos'],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Normalize kebab-case segment to snake_case */
function toSnake(s: string): string {
  return s.replace(/-/g, '_');
}

/** Naively singularize: strip trailing 's' (good enough for this domain) */
function singularize(s: string): string {
  if (s.endsWith('ies')) return s.slice(0, -3) + 'y';
  if (s.endsWith('s') && !s.endsWith('ss')) return s.slice(0, -1);
  return s;
}

/**
 * Extract meaningful resource segments from a path like
 * /api/shops/:id/members/:memberId/role
 * → ['shops', 'members']
 */
function extractSegments(path: string): string[] {
  return path
    .replace(/^\/api\//, '')
    .split('/')
    .filter((seg) => seg && !seg.startsWith(':') && !IGNORED_SEGMENTS.has(seg));
}

/**
 * Given the list of resource segments for an endpoint, return all table
 * names that match via the documented algorithm.
 */
function matchSegmentsToTables(segments: string[], tableNames: string[]): string[] {
  const matched = new Set<string>();

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const snake = toSnake(seg);

    // Special override takes priority
    if (PATH_OVERRIDES[seg]) {
      for (const t of PATH_OVERRIDES[seg]) matched.add(t);
      continue;
    }

    // Compound match first (more specific than direct match)
    // e.g. shops + members → shop_members takes priority over members
    if (i > 0) {
      const parent = singularize(toSnake(segments[i - 1]));
      const compound = `${parent}_${snake}`;
      // Exact compound match
      if (tableNames.includes(compound)) {
        matched.add(compound);
        continue;
      }
      // startsWith for partial matches (shop + ownership → shop_ownership_transfers)
      const partialMatch = tableNames.find((t) => t.startsWith(`${compound}`));
      if (partialMatch) {
        matched.add(partialMatch);
        continue;
      }
    }

    // Direct/plural match: segment === table name
    if (tableNames.includes(snake)) {
      matched.add(snake);
      continue;
    }

    // Prefix match: only for single-segment paths (no children to compound with)
    // e.g. /api/cart → cart → cart_items
    // Skip for multi-segment parents like /api/shops (would over-match shop_invites etc.)
    if (segments.length === 1) {
      const prefixMatch = tableNames.find((t) => t.startsWith(`${snake}_`));
      if (prefixMatch) {
        matched.add(prefixMatch);
        continue;
      }

      const singSnake = singularize(snake);
      if (singSnake !== snake) {
        const singPrefixMatch = tableNames.find((t) => t.startsWith(`${singSnake}_`));
        if (singPrefixMatch) {
          matched.add(singPrefixMatch);
          continue;
        }
      }
    }

    // Suffix match: table name ends with "_" + segment
    const suffixMatch = tableNames.find((t) => t.endsWith(`_${snake}`));
    if (suffixMatch) {
      matched.add(suffixMatch);
    }
  }

  return [...matched];
}

/* ------------------------------------------------------------------ */
/*  Build indexes at module scope (runs once)                          */
/* ------------------------------------------------------------------ */

const groups = apiContractsRaw.groups as RawGroup[];
const entities = dataModelRaw.entities as RawEntity[];
const tableNames = entities.map((e) => e.name);

/** table name → list of endpoints that touch it */
const tableToEndpoints = new Map<string, EndpointRef[]>();

/** "METHOD path" → list of tables it touches */
const endpointToTables = new Map<string, TableRef[]>();

// Initialize table map with empty arrays
for (const name of tableNames) {
  tableToEndpoints.set(name, []);
}

for (const group of groups) {
  for (const ep of group.endpoints) {
    const segments = extractSegments(ep.path);
    const matched = matchSegmentsToTables(segments, tableNames);

    const ref: EndpointRef = {
      method: ep.method,
      path: ep.path,
      group: group.name,
      anchor: makeAnchor(ep.method, ep.path),
    };

    const key = `${ep.method} ${ep.path}`;
    const tableRefs: TableRef[] = [];

    for (const tableName of matched) {
      // Endpoint → tables
      const entity = entities.find((e) => e.name === tableName);
      tableRefs.push({
        name: tableName,
        label: entity?.label,
        badge: entity?.badge,
      });

      // Table → endpoints
      tableToEndpoints.get(tableName)?.push(ref);
    }

    endpointToTables.set(key, tableRefs);
  }
}

/* ------------------------------------------------------------------ */
/*  Public lookup functions                                             */
/* ------------------------------------------------------------------ */

/** Return all endpoints that touch the given table */
export function getEndpointsForTable(tableName: string): EndpointRef[] {
  return tableToEndpoints.get(tableName) ?? [];
}

/** Return all tables touched by the given endpoint */
export function getTablesForEndpoint(method: string, path: string): TableRef[] {
  return endpointToTables.get(`${method} ${path}`) ?? [];
}

/* ------------------------------------------------------------------ */
/*  RLS operation → HTTP method mapping                                */
/* ------------------------------------------------------------------ */

const RLS_TO_METHOD: Record<string, string> = {
  SELECT: 'GET',
  INSERT: 'POST',
  UPDATE: 'PUT',
  DELETE: 'DELETE',
};

export function rlsOperationToMethod(operation: string): string {
  return RLS_TO_METHOD[operation.toUpperCase()] ?? 'GET';
}

/**
 * Get the best endpoint for a given table + RLS operation combo.
 * Prefers exact HTTP method match with shortest path (base resource endpoint).
 */
export function getBestEndpointForOperation(
  tableName: string,
  operation: string,
): EndpointRef | null {
  const endpoints = getEndpointsForTable(tableName);
  if (endpoints.length === 0) return null;

  const targetMethod = rlsOperationToMethod(operation);
  const methodMatches = endpoints.filter((ep) => ep.method === targetMethod);

  if (methodMatches.length > 0) {
    // Prefer shortest path — base resource endpoint (e.g. /api/cart over /api/cart/:id)
    return methodMatches.sort((a, b) => a.path.length - b.path.length)[0];
  }

  return endpoints[0];
}

/**
 * Get all endpoints matching a table + RLS operation for linking.
 */
export function getEndpointsForOperation(
  tableName: string,
  operation: string,
): EndpointRef[] {
  const endpoints = getEndpointsForTable(tableName);
  const targetMethod = rlsOperationToMethod(operation);
  return endpoints.filter((ep) => ep.method === targetMethod);
}
