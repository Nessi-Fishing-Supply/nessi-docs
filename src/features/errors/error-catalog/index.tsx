'use client';

import { useMemo, useState } from 'react';
import type { ApiGroup } from '@/types/api-contract';
import { getErrorsForEndpoint, getLinksForEndpoint } from '@/data/cross-links';
import styles from './error-catalog.module.scss';

const METHOD_COLORS: Record<string, string> = {
  GET: '#3d8c75',
  POST: '#e27739',
  PUT: '#b86e0a',
  PATCH: '#e89048',
  DELETE: '#b84040',
};

const METHOD_BG: Record<string, string> = {
  GET: 'rgba(61,140,117,0.1)',
  POST: 'rgba(226,119,57,0.1)',
  PUT: 'rgba(184,110,10,0.1)',
  PATCH: 'rgba(232,144,72,0.1)',
  DELETE: 'rgba(184,64,64,0.1)',
};

interface ErrorCatalogProps {
  groups: ApiGroup[];
}

interface EndpointData {
  method: string;
  path: string;
  description: string;
  errors: ReturnType<typeof getErrorsForEndpoint>;
  journeyCount: number;
  groupName: string;
}

function getStatusColor(status: number): string {
  if (status >= 500) return '#b84040';
  if (status >= 400) return '#e27739';
  if (status >= 300) return '#b86e0a';
  return '#3d8c75';
}

function EndpointRow({ ep }: { ep: EndpointData }) {
  const [isOpen, setIsOpen] = useState(false);
  const color = METHOD_COLORS[ep.method] ?? '#78756f';
  const bg = METHOD_BG[ep.method] ?? 'rgba(120,117,111,0.1)';
  const hasErrors = ep.errors.length > 0;

  return (
    <div
      className={`${styles.endpointCard} ${isOpen ? styles.open : ''}`}
      style={{ '--method-color': color, '--method-bg': bg } as React.CSSProperties}
    >
      <button
        className={styles.endpointHeader}
        onClick={() => hasErrors && setIsOpen((p) => !p)}
        style={{ cursor: hasErrors ? 'pointer' : 'default' }}
      >
        <span className={styles.methodBadge}>{ep.method}</span>
        <span className={styles.epPath}>{ep.path}</span>
        <span className={styles.epMeta}>
          {hasErrors ? (
            <span className={styles.errorCount}>{ep.errors.length} error{ep.errors.length !== 1 ? 's' : ''}</span>
          ) : (
            <span className={styles.noErrors}>no errors documented</span>
          )}
          {ep.journeyCount > 0 && (
            <span className={styles.journeyCount}>{ep.journeyCount} journey{ep.journeyCount !== 1 ? 's' : ''}</span>
          )}
        </span>
        {hasErrors && (
          <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
        )}
      </button>

      {isOpen && hasErrors && (
        <div className={styles.errorList}>
          {ep.errors.map((err, i) => (
            <div key={i} className={styles.errorRow}>
              <div className={styles.errorTop}>
                {err.httpStatus && (
                  <span
                    className={styles.httpBadge}
                    style={{
                      color: getStatusColor(err.httpStatus),
                      background: `${getStatusColor(err.httpStatus)}1a`,
                    }}
                  >
                    {err.httpStatus}
                  </span>
                )}
                <span className={styles.errorCondition}>{err.condition}</span>
              </div>
              <div className={styles.errorResult}>{err.result}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ErrorCatalog({ groups }: ErrorCatalogProps) {
  const data = useMemo(() => {
    const allEndpoints: EndpointData[] = [];
    for (const group of groups) {
      for (const ep of group.endpoints) {
        const errors = getErrorsForEndpoint(ep.method, ep.path);
        const journeyLinks = getLinksForEndpoint(ep.method, ep.path);
        allEndpoints.push({
          method: ep.method,
          path: ep.path,
          description: ep.description,
          errors,
          journeyCount: journeyLinks.length,
          groupName: group.name,
        });
      }
    }
    return allEndpoints;
  }, [groups]);

  const stats = useMemo(() => {
    const withErrors = data.filter((ep) => ep.errors.length > 0).length;
    const withoutErrors = data.filter((ep) => ep.errors.length === 0).length;
    const totalErrors = data.reduce((sum, ep) => sum + ep.errors.length, 0);

    const statusCounts = new Map<number, number>();
    for (const ep of data) {
      for (const err of ep.errors) {
        if (err.httpStatus) {
          statusCounts.set(err.httpStatus, (statusCounts.get(err.httpStatus) ?? 0) + 1);
        }
      }
    }
    const sortedStatuses = Array.from(statusCounts.entries()).sort((a, b) => a[0] - b[0]);

    return { withErrors, withoutErrors, totalErrors, sortedStatuses };
  }, [data]);

  const groupedData = useMemo(() => {
    return groups.map((group) => ({
      name: group.name,
      endpoints: data.filter((ep) => ep.groupName === group.name),
    }));
  }, [groups, data]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Error Catalog</h1>
        <p className={styles.subtitle}>
          Error cases surfaced from journey data, grouped by API endpoint
        </p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#3d8c75' }}>{stats.withErrors}</span>
          <span className={styles.statLabel}>endpoints with errors</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#78756f' }}>{stats.withoutErrors}</span>
          <span className={styles.statLabel}>endpoints without errors</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: '#e27739' }}>{stats.totalErrors}</span>
          <span className={styles.statLabel}>total error cases</span>
        </div>
        {stats.sortedStatuses.map(([status, count]) => (
          <div key={status} className={styles.statCard}>
            <span className={styles.statValue} style={{ color: getStatusColor(status) }}>{count}</span>
            <span className={styles.statLabel}>HTTP {status}</span>
          </div>
        ))}
      </div>

      {/* Groups */}
      {groupedData.map((group) => {
        const groupHasErrors = group.endpoints.some((ep) => ep.errors.length > 0);
        return (
          <div key={group.name} className={styles.group}>
            <div className={styles.groupHeader}>
              <h2 className={styles.groupName}>{group.name}</h2>
              {!groupHasErrors && (
                <span className={styles.noErrorsWarning}>no error docs</span>
              )}
              <span className={styles.groupCount}>{group.endpoints.length} endpoints</span>
            </div>
            <div className={styles.endpoints}>
              {group.endpoints.map((ep) => (
                <EndpointRow key={`${ep.method}-${ep.path}`} ep={ep} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
