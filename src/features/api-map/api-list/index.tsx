'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import type { ApiGroup, ApiEndpoint } from '@/types/api-contract';
import { getLinksForEndpoint, getErrorsForEndpoint } from '@/data';
import { getMethodColors } from '@/constants/colors';
import { PageHeader } from '@/components/ui/page-header';
import styles from './api-list.module.scss';

const ALL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

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

function EndpointDetail({ endpoint }: { endpoint: ApiEndpoint }) {
  const errors = getErrorsForEndpoint(endpoint.method, endpoint.path);
  const journeyLinks = getLinksForEndpoint(endpoint.method, endpoint.path);
  const hasRequestFields = endpoint.requestFields && endpoint.requestFields.length > 0;
  const responseCodes = buildResponseCodes(endpoint.errorCodes);

  return (
    <div className={styles.epDetail}>
      {endpoint.description && (
        <p className={styles.epDescription}>{endpoint.description}</p>
      )}
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
                    href="/permissions"
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
                  <Link key={i} href={link.href} className={styles.journeyChip}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Endpoint Row ── */

function EndpointRow({ endpoint, staggerIndex }: { endpoint: ApiEndpoint; staggerIndex: number }) {
  const slug = `${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '')}`;
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const { color, bg, border } = getMethodColors(endpoint.method);
  const errors = getErrorsForEndpoint(endpoint.method, endpoint.path);
  const errorCount = errors.length;

  // Deep-link: sequential animation — stagger in → expand → scroll → glow
  useEffect(() => {
    function checkHash() {
      if (window.location.hash === `#${slug}`) {
        // Wait for stagger animation to complete (stagger delay + 200ms animation duration)
        const staggerDelay = staggerIndex * 20;
        const animationDuration = 200;
        const expandDelay = staggerDelay + animationDuration + 100; // +100ms buffer

        // Step 1: Let the row animate in naturally, then expand it
        setTimeout(() => {
          setIsOpen(true);

          // Step 2: After expansion renders, scroll into view
          setTimeout(() => {
            rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Step 3: After scroll settles, start the glow
            setTimeout(() => {
              setHighlight(true);
              setTimeout(() => setHighlight(false), 9500);
            }, 400); // allow scroll to settle
          }, 50); // allow expansion to render
        }, expandDelay);
      }
    }

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [slug, staggerIndex]);

  const pathParts = endpoint.path.split(/(:[\w]+)/g);

  return (
    <div
      ref={rowRef}
      id={slug}
      className={`${styles.epRow} ${isOpen ? styles.epRowOpen : ''} ${highlight ? styles.epRowHighlight : ''}`}
      style={
        {
          '--method-color': color,
          '--method-bg': bg,
          '--method-border': border,
          '--stagger': `${staggerIndex * 20}ms`,
        } as React.CSSProperties
      }
    >
      <button className={styles.epRowHeader} onClick={() => setIsOpen((p) => !p)}>
        <span className={styles.methodBadge}>{endpoint.method}</span>
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
              href="/permissions"
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

/* ── Main Component ── */

interface ApiListProps {
  groups: ApiGroup[];
  totalEndpoints: number;
}

export function ApiList({ groups, totalEndpoints }: ApiListProps) {
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
      .map((g) => ({
        ...g,
        endpoints: g.endpoints.filter((ep) => activeMethods.has(ep.method)),
      }))
      .filter((g) => g.endpoints.length > 0);
  }, [groups, activeGroups, activeMethods]);

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
            <div className={styles.groupDivider}>
              <span className={styles.groupName}>{group.name}</span>
              <span className={styles.groupLine} />
              <span className={styles.groupCount}>{group.endpoints.length}</span>
            </div>

            {group.endpoints.map((ep) => {
              const idx = staggerIndex++;
              return (
                <EndpointRow key={`${ep.method}-${ep.path}`} endpoint={ep} staggerIndex={idx} />
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
