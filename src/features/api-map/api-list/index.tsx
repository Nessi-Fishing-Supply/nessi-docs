'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import type { ApiGroup, ApiEndpoint } from '@/types/api-contract';
import { getLinksForEndpoint, getErrorsForEndpoint } from '@/data';
import { getMethodColors } from '@/constants/colors';
import { useBranchHref } from '@/providers/branch-provider';
import { PageHeader } from '@/components/ui/page-header';
import { BorderTrace } from '@/components/ui/border-trace';
import { GitHubLink } from '@/components/ui/github-link';
import { useDiffMode } from '@/hooks/use-diff-mode';
import { DiffBadge } from '@/components/ui/diff-badge';
import type { DiffStatus, ApiGroupDiff } from '@/types/diff';
import styles from './api-list.module.scss';

const ALL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

function getEndpointDiffStatus(
  method: string,
  path: string,
  groupDiffs: ApiGroupDiff[] | undefined,
  groupName: string,
): DiffStatus | null {
  if (!groupDiffs) return null;
  const gd = groupDiffs.find((g) => g.group.name === groupName);
  if (!gd) return null;
  const key = `${method}:${path}`;
  if (gd.endpointDiffs.added.some((ep) => `${ep.method}:${ep.path}` === key)) return 'added';
  if (gd.endpointDiffs.removed.some((ep) => `${ep.method}:${ep.path}` === key)) return 'removed';
  if (gd.endpointDiffs.modified.some((m) => `${m.head.method}:${m.head.path}` === key))
    return 'modified';
  return 'unchanged';
}

/* ── Filter Bar ── */

function FilterBar({
  groups,
  activeGroups,
  activeMethods,
  onToggleGroup,
  onToggleMethod,
  onToggleAllGroups,
}: {
  groups: ApiGroup[];
  activeGroups: Set<string>;
  activeMethods: Set<string>;
  onToggleGroup: (name: string) => void;
  onToggleMethod: (method: string) => void;
  onToggleAllGroups: () => void;
}) {
  const allGroupsActive = activeGroups.size === groups.length;

  return (
    <div className={styles.filterBar}>
      <span className={styles.filterLabel}>Group</span>
      <button
        className={`${styles.filterChip} ${allGroupsActive ? styles.filterChipActive : ''}`}
        onClick={onToggleAllGroups}
      >
        All{' '}
        <span className={styles.chipCount}>
          {groups.reduce((s, g) => s + g.endpoints.length, 0)}
        </span>
      </button>
      {groups.map((g) => (
        <button
          key={g.name}
          className={`${styles.filterChip} ${activeGroups.has(g.name) ? styles.filterChipActive : ''}`}
          onClick={() => onToggleGroup(g.name)}
        >
          {g.name} <span className={styles.chipCount}>{g.endpoints.length}</span>
        </button>
      ))}

      <span className={styles.filterDivider} />
      <span className={styles.filterLabel}>Method</span>
      {ALL_METHODS.map((m) => {
        const { color, bg, border } = getMethodColors(m);
        return (
          <button
            key={m}
            className={`${styles.methodChip} ${activeMethods.has(m) ? styles.methodChipActive : ''}`}
            style={
              {
                '--mc': color,
                '--mbg': bg,
                '--mborder': border,
              } as React.CSSProperties
            }
            onClick={() => onToggleMethod(m)}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

/* ── Endpoint Detail (Expanded) ── */

/* ── Group Divider with deep-link support ── */

function GroupDivider({ name, count }: { name: string; count: number }) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    function checkHash() {
      const hashes = window.location.hash.split('#').filter(Boolean);
      if (hashes.includes(slug)) {
        setHighlight(true);
        history.replaceState(null, '', window.location.pathname);
        setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        setTimeout(() => setHighlight(false), 9500);
      }
    }

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [slug]);

  return (
    <div ref={ref} id={slug} className={styles.groupDivider} style={{ position: 'relative' }}>
      <BorderTrace active={highlight} />
      <span className={styles.groupName}>{name}</span>
      <span className={styles.groupLine} />
      <span className={styles.groupCount}>{count}</span>
    </div>
  );
}

function EndpointDetail({ endpoint }: { endpoint: ApiEndpoint }) {
  const branchHref = useBranchHref();
  const errors = getErrorsForEndpoint(endpoint.method, endpoint.path);
  const journeyLinks = getLinksForEndpoint(endpoint.method, endpoint.path);
  const hasRequestFields = endpoint.requestFields && endpoint.requestFields.length > 0;
  const responseCodes = buildResponseCodes(endpoint.errorCodes);

  return (
    <div className={styles.epDetail}>
      {endpoint.description && <p className={styles.epDescription}>{endpoint.description}</p>}
      <div className={hasRequestFields ? styles.detailCols : undefined}>
        {hasRequestFields && (
          <div>
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Request Body</div>
              <div className={styles.fieldTable}>
                {endpoint.requestFields!.map((f) => (
                  <div key={f.name} className={styles.fieldRow}>
                    <span className={styles.fieldName}>{f.name}</span>
                    <span className={styles.fieldType}>{f.type}</span>
                    {f.required && <span className={styles.fieldReq}>required</span>}
                  </div>
                ))}
              </div>
            </div>

            {errors.length > 0 && (
              <div className={styles.detailSection}>
                <div className={styles.detailLabel}>Error Cases</div>
                {errors.map((err, i) => (
                  <div key={i} className={styles.errorCase}>
                    {err.httpStatus && <span className={styles.errorHttp}>{err.httpStatus}</span>}
                    <span className={styles.errorText}>
                      {err.condition}
                      {err.result && <> &mdash; {err.result}</>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <div className={styles.detailSection}>
            <div className={styles.detailLabel}>Responses</div>
            <div className={styles.responseRow}>
              {responseCodes.map((rc) => (
                <span
                  key={rc.code}
                  className={`${styles.statusPill} ${rc.isError ? styles.statusError : styles.statusSuccess}`}
                >
                  {rc.code} <span className={styles.statusDesc}>{rc.label}</span>
                </span>
              ))}
            </div>
          </div>

          {endpoint.access && endpoint.access.length > 0 && (
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Access</div>
              <div className={styles.accessRow}>
                {endpoint.access.map((ctx) => (
                  <Link
                    key={ctx}
                    href={branchHref('/config#__roles__')}
                    className={`${styles.accessBadge} ${ctx === 'Shop' ? styles.accessShop : ''}`}
                  >
                    <span className={styles.accessDot} />
                    {ctx}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!hasRequestFields && errors.length > 0 && (
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Error Cases</div>
              {errors.map((err, i) => (
                <div key={i} className={styles.errorCase}>
                  {err.httpStatus && <span className={styles.errorHttp}>{err.httpStatus}</span>}
                  <span className={styles.errorText}>
                    {err.condition}
                    {err.result && <> &mdash; {err.result}</>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {journeyLinks.length > 0 && (
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Used in Journeys</div>
              <div className={styles.journeyChips}>
                {journeyLinks.map((link, i) => (
                  <Link key={i} href={branchHref(link.href)} className={styles.journeyChip}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {endpoint.sourceFile && (
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Source</div>
              <GitHubLink filePath={endpoint.sourceFile} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Endpoint Row ── */

function EndpointRow({
  endpoint,
  staggerIndex,
  diffStatus,
}: {
  endpoint: ApiEndpoint;
  staggerIndex: number;
  diffStatus: DiffStatus | null;
}) {
  const branchHref = useBranchHref();
  const slug = `${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '')}`;
  const [isDeepLinkTarget] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.location.hash.split('#').filter(Boolean).includes(slug),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const { color, bg, border } = getMethodColors(endpoint.method);
  const errors = getErrorsForEndpoint(endpoint.method, endpoint.path);
  const errorCount = errors.length;

  // Deep-link: expand → scroll → glow (matches Data Model timing)
  useEffect(() => {
    function checkHash() {
      const hashes = window.location.hash.split('#').filter(Boolean);
      if (hashes.includes(slug)) {
        setIsOpen(true);
        setHighlight(true);
        history.replaceState(null, '', window.location.pathname);
        setTimeout(
          () => rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          100,
        );
        setTimeout(() => setHighlight(false), 9500);
      }
    }

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [slug]);

  const pathParts = endpoint.path.split(/(:[\w]+)/g);

  return (
    <div
      ref={rowRef}
      id={slug}
      className={`${styles.epRow} ${isOpen ? styles.epRowOpen : ''} ${diffStatus ? styles[`diff_${diffStatus}`] : ''}`}
      style={
        {
          '--method-color': color,
          '--method-bg': bg,
          '--method-border': border,
          '--stagger': isDeepLinkTarget ? '0ms' : `${staggerIndex * 20}ms`,
        } as React.CSSProperties
      }
    >
      <BorderTrace active={highlight} />
      <button
        className={styles.epRowHeader}
        onClick={
          diffStatus === 'removed' || diffStatus === 'unchanged'
            ? undefined
            : () => setIsOpen((p) => !p)
        }
        style={
          diffStatus === 'removed' || diffStatus === 'unchanged' ? { cursor: 'default' } : undefined
        }
      >
        <span className={styles.methodBadge}>{endpoint.method}</span>
        {diffStatus && diffStatus !== 'unchanged' && <DiffBadge status={diffStatus} />}
        <span className={styles.epPath}>
          {pathParts.map((part, i) =>
            part.startsWith(':') ? (
              <span key={i} className={styles.epParam}>
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </span>
        <span className={styles.epMeta}>
          {endpoint.access?.map((ctx) => (
            <Link
              key={ctx}
              href={branchHref('/config#__roles__')}
              className={`${styles.epAccess} ${ctx === 'Shop' ? styles.epAccessShop : ''}`}
            >
              {ctx}
            </Link>
          ))}
          {errorCount > 0 && <span className={styles.epErrors}>{errorCount}</span>}
          <span className={styles.epChevron}>&#9656;</span>
        </span>
      </button>

      {isOpen && <EndpointDetail endpoint={endpoint} />}
    </div>
  );
}

/* ── Helpers ── */

interface ResponseCode {
  code: number;
  label: string;
  isError: boolean;
}

function buildResponseCodes(errorCodes?: number[]): ResponseCode[] {
  const codes: ResponseCode[] = [{ code: 200, label: 'OK', isError: false }];
  const seen = new Set<number>([200]);

  const STATUS_LABELS: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable',
    500: 'Server Error',
  };

  if (errorCodes) {
    for (const code of errorCodes) {
      if (!seen.has(code)) {
        seen.add(code);
        codes.push({ code, label: STATUS_LABELS[code] ?? 'Error', isError: code >= 400 });
      }
    }
  }

  return codes;
}

/* ── Helpers ── */

function diffSort<T>(
  items: T[],
  getKey: (item: T) => string,
  statusMap: Map<string, DiffStatus> | undefined,
): T[] {
  if (!statusMap) return items;
  return [...items].sort((a, b) => {
    const aStatus = statusMap.get(getKey(a));
    const bStatus = statusMap.get(getKey(b));
    const aChanged = aStatus === 'added' || aStatus === 'modified';
    const bChanged = bStatus === 'added' || bStatus === 'modified';
    if (aChanged && !bChanged) return -1;
    if (!aChanged && bChanged) return 1;
    return 0;
  });
}

/* ── Main Component ── */

interface ApiListProps {
  groups: ApiGroup[];
  totalEndpoints: number;
}

export function ApiList({ groups, totalEndpoints }: ApiListProps) {
  const { isActive: isDiffMode, diffResult } = useDiffMode();
  const apiGroupDiffs = isDiffMode ? diffResult?.apiGroupDiffs : undefined;

  const [activeGroups, setActiveGroups] = useState<Set<string>>(
    () => new Set(groups.map((g) => g.name)),
  );
  const [activeMethods, setActiveMethods] = useState<Set<string>>(() => new Set(ALL_METHODS));

  const allGroupNames = useMemo(() => new Set(groups.map((g) => g.name)), [groups]);

  const toggleGroup = (name: string) => {
    setActiveGroups((prev) => {
      const allSelected = prev.size === allGroupNames.size;
      if (allSelected) {
        // From "all" state, clicking one shows only that one
        return new Set([name]);
      }
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        // If nothing left, go back to all
        return next.size === 0 ? new Set(allGroupNames) : next;
      }
      next.add(name);
      return next;
    });
  };

  const toggleAllGroups = () => {
    setActiveGroups(new Set(allGroupNames));
  };

  const toggleMethod = (method: string) => {
    setActiveMethods((prev) => {
      const allSelected = prev.size === ALL_METHODS.length;
      if (allSelected) {
        return new Set([method]);
      }
      const next = new Set(prev);
      if (next.has(method)) {
        next.delete(method);
        return next.size === 0 ? new Set(ALL_METHODS) : next;
      }
      next.add(method);
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    return groups
      .filter((g) => activeGroups.has(g.name))
      .map((g) => {
        const filtered = g.endpoints.filter((ep) => activeMethods.has(ep.method));
        const sorted = isDiffMode
          ? diffSort(
              filtered,
              (ep) => `${ep.method}:${ep.path}`,
              (() => {
                if (!apiGroupDiffs) return undefined;
                const gd = apiGroupDiffs.find((d) => d.group.name === g.name);
                if (!gd) return undefined;
                const map = new Map<string, DiffStatus>();
                for (const ep of gd.endpointDiffs.added)
                  map.set(`${ep.method}:${ep.path}`, 'added');
                for (const ep of gd.endpointDiffs.unchanged)
                  map.set(`${ep.method}:${ep.path}`, 'unchanged');
                for (const m of gd.endpointDiffs.modified)
                  map.set(`${m.head.method}:${m.head.path}`, 'modified');
                return map;
              })(),
            )
          : filtered;
        return { ...g, endpoints: sorted };
      })
      .filter((g) => g.endpoints.length > 0);
  }, [groups, activeGroups, activeMethods, isDiffMode, apiGroupDiffs]);

  let staggerIndex = 0;

  return (
    <div className={styles.container}>
      <PageHeader
        title="API Map"
        metrics={[
          { value: totalEndpoints, label: 'endpoints' },
          { value: groups.length, label: 'groups' },
        ]}
      />

      <FilterBar
        groups={groups}
        activeGroups={activeGroups}
        activeMethods={activeMethods}
        onToggleGroup={toggleGroup}
        onToggleMethod={toggleMethod}
        onToggleAllGroups={toggleAllGroups}
      />

      <div className={styles.epContainer}>
        {filteredGroups.map((group) => (
          <div key={group.name}>
            <GroupDivider name={group.name} count={group.endpoints.length} />

            {group.endpoints.map((ep) => {
              const idx = staggerIndex++;
              return (
                <EndpointRow
                  key={`${ep.method}-${ep.path}`}
                  endpoint={ep}
                  staggerIndex={idx}
                  diffStatus={getEndpointDiffStatus(ep.method, ep.path, apiGroupDiffs, group.name)}
                />
              );
            })}

            {isDiffMode &&
              apiGroupDiffs &&
              (() => {
                const gd = apiGroupDiffs.find((g) => g.group.name === group.name);
                if (!gd) return null;
                return gd.endpointDiffs.removed.map((ep) => (
                  <EndpointRow
                    key={`removed-${ep.method}-${ep.path}`}
                    endpoint={ep}
                    staggerIndex={0}
                    diffStatus="removed"
                  />
                ));
              })()}
          </div>
        ))}

        {isDiffMode &&
          apiGroupDiffs &&
          apiGroupDiffs
            .filter((gd) => gd.status === 'removed')
            .map((gd) => (
              <div key={`removed-group-${gd.group.name}`}>
                <GroupDivider name={gd.group.name} count={gd.group.endpoints.length} />
                {gd.group.endpoints.map((ep) => (
                  <EndpointRow
                    key={`removed-${ep.method}-${ep.path}`}
                    endpoint={ep}
                    staggerIndex={0}
                    diffStatus="removed"
                  />
                ))}
              </div>
            ))}

        {filteredGroups.length === 0 && (
          <div className={styles.emptyState}>No endpoints match the current filters.</div>
        )}
      </div>
    </div>
  );
}
