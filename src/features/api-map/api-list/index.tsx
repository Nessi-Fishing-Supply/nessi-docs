'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ApiGroup, ApiEndpoint, RequestField } from '@/types/api-contract';
import { getLinksForEndpoint, getErrorsForEndpoint } from '@/data';
import { getMethodColors } from '@/constants/colors';
import { useBranchHref } from '@/providers/branch-provider';
import { PageHeader } from '@/components/layout/page-header';
import { CollapsibleRow } from '@/components/layout/collapsible-row';
import { FieldTable, type FieldTableColumn } from '@/components/data-display/field-table';
import { FilterBar, FilterChip } from '@/components/layout/filter-bar';
import { GitHubLink } from '@/components/data-display/github-link';
import { useDiffMode } from '@/hooks/use-diff-mode';
import { useDocsContext } from '@/providers/docs-provider';
import { Badge } from '@/components/indicators/badge';
import {
  DiffFilterBar,
  type DiffStatusFilter,
} from '@/components/layout/filter-bar/diff-filter-bar';
import type { DiffStatus, ApiGroupDiff, FieldChange } from '@/types/diff';
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

/* ── Group Divider with deep-link support ── */

function GroupDivider({ name, count }: { name: string; count: number }) {
  return (
    <div className={styles.groupDivider}>
      <span className={styles.groupName}>{name}</span>
      <span className={styles.groupLine} />
      <span className={styles.groupCount}>{count}</span>
    </div>
  );
}

/* ── Request Field Table Columns ── */

function useRequestFieldColumns(): FieldTableColumn<RequestField>[] {
  return useMemo(
    () => [
      {
        key: 'name',
        label: 'Field',
        width: '90px',
        render: (_value: unknown, field: RequestField) => (
          <span className={styles.fieldName}>{field.name}</span>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        width: '60px',
        render: (_value: unknown, field: RequestField) => (
          <span className={styles.fieldType}>{field.type}</span>
        ),
      },
      {
        key: 'required',
        label: '',
        render: (_value: unknown, field: RequestField) =>
          field.required ? <span className={styles.fieldReq}>required</span> : null,
      },
    ],
    [],
  );
}

/* ── Endpoint Row Header ── */

function EndpointRowHeader({
  endpoint,
  diffStatus,
}: {
  endpoint: ApiEndpoint;
  diffStatus: DiffStatus | null;
}) {
  const branchHref = useBranchHref();
  const { color, bg, border } = getMethodColors(endpoint.method);
  const errors = getErrorsForEndpoint(endpoint.method, endpoint.path);
  const errorCount = errors.length;
  const pathParts = endpoint.path.split(/(:[\w]+)/g);

  return (
    <>
      <span
        className={styles.methodBadge}
        style={
          {
            '--method-color': color,
            '--method-bg': bg,
            '--method-border': border,
          } as React.CSSProperties
        }
      >
        {endpoint.method}
      </span>
      {diffStatus && diffStatus !== 'unchanged' && <Badge variant="diff" status={diffStatus} />}
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
            onClick={(e) => e.stopPropagation()}
          >
            {ctx}
          </Link>
        ))}
        {errorCount > 0 && <span className={styles.epErrors}>{errorCount}</span>}
      </span>
    </>
  );
}

/* ── Endpoint Detail (Expanded) ── */

function EndpointDetail({
  endpoint,
  changedFields,
}: {
  endpoint: ApiEndpoint;
  changedFields?: FieldChange[];
}) {
  const branchHref = useBranchHref();
  const errors = getErrorsForEndpoint(endpoint.method, endpoint.path);
  const journeyLinks = getLinksForEndpoint(endpoint.method, endpoint.path);
  const hasRequestFields = endpoint.requestFields && endpoint.requestFields.length > 0;
  const responseCodes = buildResponseCodes(endpoint.errorCodes);
  const columns = useRequestFieldColumns();

  // Track which top-level fields changed for section highlighting
  const changedFieldSet = useMemo(() => {
    if (!changedFields) return new Set<string>();
    return new Set(changedFields.map((c) => c.field));
  }, [changedFields]);

  // Compute added request fields from changedFields
  const { changedRequestFieldNames, addedRequestFields } = useMemo(() => {
    const empty = {
      changedRequestFieldNames: new Set<string>(),
      addedRequestFields: [] as RequestField[],
    };
    if (!changedFields) return empty;
    const rf = changedFields.find((c) => c.field === 'requestFields');
    if (!rf) return empty;
    const base = Array.isArray(rf.baseValue) ? rf.baseValue : [];
    const head = Array.isArray(rf.headValue) ? rf.headValue : [];
    const baseNames = new Set(base.map((f: { name: string }) => f.name));
    const changed = new Set<string>();
    const added: RequestField[] = [];
    for (const f of head as RequestField[]) {
      if (!baseNames.has(f.name)) {
        changed.add(f.name);
        added.push(f);
      }
    }
    return { changedRequestFieldNames: changed, addedRequestFields: added };
  }, [changedFields]);

  return (
    <div className={styles.epDetail}>
      {endpoint.description && (
        <p
          className={`${styles.epDescription} ${changedFieldSet.has('description') ? styles.fieldHighlight : ''}`}
        >
          {endpoint.description}
        </p>
      )}
      <div
        className={
          hasRequestFields || addedRequestFields.length > 0 ? styles.detailCols : undefined
        }
      >
        {(hasRequestFields || addedRequestFields.length > 0) && (
          <div>
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Request Body</div>
              <FieldTable
                fields={endpoint.requestFields ?? []}
                columns={columns}
                changedFields={changedRequestFieldNames}
                addedFields={addedRequestFields}
              />
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

/* ── Main Component ── */

interface ApiListProps {
  groups: ApiGroup[];
  totalEndpoints: number;
}

export function ApiList({ groups, totalEndpoints }: ApiListProps) {
  const branchHref = useBranchHref();
  const { setSelectedItem } = useDocsContext();
  const { isActive: isDiffMode, diffResult } = useDiffMode();
  const apiGroupDiffs = isDiffMode ? diffResult?.apiGroupDiffs : undefined;
  const [diffFilter, setDiffFilter] = useState<DiffStatusFilter>('all');

  const epChangedFieldsMap = useMemo(() => {
    const map = new Map<string, FieldChange[]>();
    if (!apiGroupDiffs) return map;
    for (const gd of apiGroupDiffs) {
      if (gd.status === 'unchanged' || gd.status === 'added' || gd.status === 'removed') continue;
      for (const mod of gd.endpointDiffs.modified) {
        map.set(`${mod.head.method}:${mod.head.path}`, mod.changes);
      }
    }
    return map;
  }, [apiGroupDiffs]);

  const diffCounts = useMemo(() => {
    if (!apiGroupDiffs) return { added: 0, modified: 0, removed: 0 };
    let added = 0;
    let modified = 0;
    let removed = 0;
    for (const gd of apiGroupDiffs) {
      if (gd.status === 'added') {
        added += gd.group.endpoints.length;
      } else if (gd.status === 'removed') {
        removed += gd.group.endpoints.length;
      } else {
        added += gd.endpointDiffs.added.length;
        modified += gd.endpointDiffs.modified.length;
        removed += gd.endpointDiffs.removed.length;
      }
    }
    return { added, modified, removed };
  }, [apiGroupDiffs]);

  const [openEndpoints, setOpenEndpoints] = useState<Set<string>>(new Set());
  const [activeGroups, setActiveGroups] = useState<Set<string>>(
    () => new Set(groups.map((g) => g.name)),
  );
  const [activeMethods, setActiveMethods] = useState<Set<string>>(() => new Set(ALL_METHODS));

  const allGroupNames = useMemo(() => new Set(groups.map((g) => g.name)), [groups]);

  const toggleGroup = (name: string) => {
    setActiveGroups((prev) => {
      const allSelected = prev.size === allGroupNames.size;
      if (allSelected) {
        return new Set([name]);
      }
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
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

  const toggleEndpoint = (id: string) => {
    setOpenEndpoints((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    return groups
      .filter((g) => activeGroups.has(g.name))
      .map((g) => {
        let filtered = g.endpoints.filter((ep) => activeMethods.has(ep.method));
        // Apply diff status filter — 'all' in compare mode means "all changes" (not unchanged)
        if (isDiffMode && apiGroupDiffs) {
          const gd = apiGroupDiffs.find((d) => d.group.name === g.name);
          if (gd) {
            const statusMap = new Map<string, DiffStatus>();
            for (const ep of gd.endpointDiffs.added)
              statusMap.set(`${ep.method}:${ep.path}`, 'added');
            for (const ep of gd.endpointDiffs.unchanged)
              statusMap.set(`${ep.method}:${ep.path}`, 'unchanged');
            for (const m of gd.endpointDiffs.modified)
              statusMap.set(`${m.head.method}:${m.head.path}`, 'modified');
            if (diffFilter === 'all') {
              filtered = filtered.filter((ep) => {
                const s = statusMap.get(`${ep.method}:${ep.path}`);
                return s === 'added' || s === 'modified' || s === 'removed';
              });
            } else {
              filtered = filtered.filter(
                (ep) => statusMap.get(`${ep.method}:${ep.path}`) === diffFilter,
              );
            }
          } else {
            filtered = [];
          }
        }
        return { ...g, endpoints: filtered };
      })
      .filter((g) => g.endpoints.length > 0);
  }, [groups, activeGroups, activeMethods, isDiffMode, apiGroupDiffs, diffFilter]);

  const getEndpointSlug = (ep: ApiEndpoint) =>
    `${ep.method.toLowerCase()}-${ep.path.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '')}`;

  const handleExpand = (endpoint: ApiEndpoint, diffStatus: DiffStatus | null) => {
    if (diffStatus && diffStatus !== 'unchanged') {
      const slug = getEndpointSlug(endpoint);
      setSelectedItem({
        type: 'diff-item',
        item: {
          key: `${endpoint.method}:${endpoint.path}`,
          label: `${endpoint.method} ${endpoint.path}`,
          status: diffStatus,
          domain: 'API Map',
          href: branchHref(`/api-map#${slug}`),
          changedFields: epChangedFieldsMap.get(`${endpoint.method}:${endpoint.path}`),
          data: endpoint,
        },
      });
    }
  };

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

      {!isDiffMode && (
        <FilterBar className={styles.filterBar}>
          <span className={styles.filterLabel}>Group</span>
          <FilterChip
            label="All"
            active={activeGroups.size === groups.length}
            onToggle={toggleAllGroups}
            count={groups.reduce((s, g) => s + g.endpoints.length, 0)}
          />
          {groups.map((g) => (
            <FilterChip
              key={g.name}
              label={g.name}
              active={activeGroups.has(g.name)}
              onToggle={() => toggleGroup(g.name)}
              count={g.endpoints.length}
            />
          ))}

          <span className={styles.filterDivider} />
          <span className={styles.filterLabel}>Method</span>
          {ALL_METHODS.map((m) => {
            const { color, bg, border } = getMethodColors(m);
            return (
              <FilterChip
                key={m}
                label={m}
                active={activeMethods.has(m)}
                onToggle={() => toggleMethod(m)}
                color={color}
                colorBg={bg}
                colorBorder={border}
                className={styles.methodChip}
              />
            );
          })}
        </FilterBar>
      )}

      {isDiffMode && (
        <div className={styles.diffFilterRow}>
          <DiffFilterBar active={diffFilter} onChange={setDiffFilter} counts={diffCounts} />
        </div>
      )}

      <div className={styles.epContainer}>
        {filteredGroups.map((group) => (
          <div key={group.name}>
            <GroupDivider name={group.name} count={group.endpoints.length} />

            {group.endpoints.map((ep) => {
              const idx = staggerIndex++;
              const slug = getEndpointSlug(ep);
              const diffStatus = getEndpointDiffStatus(
                ep.method,
                ep.path,
                apiGroupDiffs,
                group.name,
              );
              return (
                <CollapsibleRow
                  key={`${ep.method}-${ep.path}`}
                  id={slug}
                  staggerIndex={idx}
                  isOpen={openEndpoints.has(slug)}
                  onToggle={() => toggleEndpoint(slug)}
                  diffStatus={diffStatus ?? undefined}
                  onExpand={() => handleExpand(ep, diffStatus)}
                  header={<EndpointRowHeader endpoint={ep} diffStatus={diffStatus} />}
                >
                  <EndpointDetail
                    endpoint={ep}
                    changedFields={epChangedFieldsMap.get(`${ep.method}:${ep.path}`)}
                  />
                </CollapsibleRow>
              );
            })}

            {isDiffMode &&
              apiGroupDiffs &&
              (diffFilter === 'all' || diffFilter === 'added') &&
              (() => {
                const gd = apiGroupDiffs.find((g) => g.group.name === group.name);
                if (!gd) return null;
                return gd.endpointDiffs.added.map((ep) => {
                  const slug = getEndpointSlug(ep);
                  return (
                    <CollapsibleRow
                      key={`added-${ep.method}-${ep.path}`}
                      id={slug}
                      staggerIndex={0}
                      isOpen={openEndpoints.has(slug)}
                      onToggle={() => toggleEndpoint(slug)}
                      diffStatus="added"
                      onExpand={() => handleExpand(ep, 'added')}
                      header={<EndpointRowHeader endpoint={ep} diffStatus="added" />}
                    >
                      <EndpointDetail endpoint={ep} />
                    </CollapsibleRow>
                  );
                });
              })()}
          </div>
        ))}

        {isDiffMode &&
          apiGroupDiffs &&
          (diffFilter === 'all' || diffFilter === 'added') &&
          apiGroupDiffs
            .filter((gd) => gd.status === 'added')
            .map((gd) => (
              <div key={`added-group-${gd.group.name}`}>
                <GroupDivider name={gd.group.name} count={gd.group.endpoints.length} />
                {gd.group.endpoints.map((ep) => {
                  const slug = getEndpointSlug(ep);
                  return (
                    <CollapsibleRow
                      key={`added-${ep.method}-${ep.path}`}
                      id={slug}
                      staggerIndex={0}
                      isOpen={openEndpoints.has(slug)}
                      onToggle={() => toggleEndpoint(slug)}
                      diffStatus="added"
                      onExpand={() => handleExpand(ep, 'added')}
                      header={<EndpointRowHeader endpoint={ep} diffStatus="added" />}
                    >
                      <EndpointDetail endpoint={ep} />
                    </CollapsibleRow>
                  );
                })}
              </div>
            ))}

        {filteredGroups.length === 0 && (
          <div className={styles.emptyState}>No endpoints match the current filters.</div>
        )}
      </div>
    </div>
  );
}
