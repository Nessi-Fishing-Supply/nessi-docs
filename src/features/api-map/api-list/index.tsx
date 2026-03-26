'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ApiGroup, ApiEndpoint } from '@/types/api-contract';
import { useDocsContext } from '@/providers/docs-provider';
import { getLinksForEndpoint, getErrorsForEndpoint } from '@/data';
import styles from './api-list.module.scss';

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

const METHOD_BORDER: Record<string, string> = {
  GET: 'rgba(61,140,117,0.25)',
  POST: 'rgba(226,119,57,0.25)',
  PUT: 'rgba(184,110,10,0.25)',
  PATCH: 'rgba(232,144,72,0.25)',
  DELETE: 'rgba(184,64,64,0.25)',
};

interface ApiListProps {
  groups: ApiGroup[];
}

function EndpointCard({ endpoint, groupName }: { endpoint: ApiEndpoint; groupName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { setSelectedItem } = useDocsContext();
  const color = METHOD_COLORS[endpoint.method] ?? '#78756f';
  const bg = METHOD_BG[endpoint.method] ?? 'rgba(120,117,111,0.1)';
  const border = METHOD_BORDER[endpoint.method] ?? 'rgba(120,117,111,0.25)';
  const errors = getErrorsForEndpoint(endpoint.method, endpoint.path);
  const journeyLinks = getLinksForEndpoint(endpoint.method, endpoint.path);

  const handleClick = () => {
    setIsOpen((p) => !p);
    setSelectedItem({ type: 'api', endpoint, group: groupName });
  };

  // Parse HTTP status codes from the why text (e.g. "409 DUPLICATE_EMAIL", "Returns 404")
  const statusCodes = extractStatusCodes(endpoint.why, errors);

  return (
    <div
      id={endpoint.path.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
      className={`${styles.card} ${isOpen ? styles.open : ''}`}
      style={{ '--method-color': color, '--method-bg': bg, '--method-border': border } as React.CSSProperties}
    >
      <button className={styles.cardHeader} onClick={handleClick}>
        <span className={styles.methodBadge}>{endpoint.method}</span>
        <span className={styles.path}>{endpoint.path}</span>
        <span className={styles.desc}>{endpoint.description}</span>
        <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
      </button>

      {isOpen && (
        <div className={styles.cardBody}>
          {/* Description */}
          <div className={styles.section}>
            <p className={styles.fullDesc}>{endpoint.description}</p>
          </div>

          {/* Why / Implementation Notes */}
          {endpoint.why && (
            <div className={styles.section}>
              <h4 className={styles.sectionLabel}>Implementation Details</h4>
              <div className={styles.implBlock}>{endpoint.why}</div>
            </div>
          )}

          {/* Response codes */}
          {statusCodes.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionLabel}>Responses</h4>
              <div className={styles.responses}>
                {statusCodes.map((sc, i) => (
                  <div key={i} className={`${styles.responseRow} ${sc.isError ? styles.errorResponse : styles.successResponse}`}>
                    <span className={styles.statusCode}>{sc.code}</span>
                    <span className={styles.statusDesc}>{sc.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error cases from journeys */}
          {errors.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionLabel}>Error Cases</h4>
              <div className={styles.errorList}>
                {errors.map((err, i) => (
                  <div key={i} className={styles.errorItem}>
                    <div className={styles.errorCondition}>
                      {err.httpStatus && <span className={styles.httpBadge}>{err.httpStatus}</span>}
                      {err.condition}
                    </div>
                    <div className={styles.errorResult}>{err.result}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Journey usage */}
          {journeyLinks.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionLabel}>Used in Journeys</h4>
              <div className={styles.journeyLinks}>
                {journeyLinks.map((link, i) => (
                  <Link key={i} href={link.href} className={styles.journeyLink}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StatusCode {
  code: string;
  description: string;
  isError: boolean;
}

function extractStatusCodes(why: string | undefined, errors: { httpStatus?: number; condition: string }[]): StatusCode[] {
  const codes: StatusCode[] = [];
  const seen = new Set<string>();

  // Always add a success response
  codes.push({ code: '200', description: 'Success', isError: false });
  seen.add('200');

  // Extract from errors
  for (const err of errors) {
    if (err.httpStatus) {
      const key = String(err.httpStatus);
      if (!seen.has(key)) {
        seen.add(key);
        codes.push({ code: key, description: err.condition, isError: true });
      }
    }
  }

  // Parse codes from why text
  if (why) {
    const matches = why.matchAll(/(\d{3})\s+([A-Z_]+)/g);
    for (const m of matches) {
      const code = m[1];
      if (!seen.has(code)) {
        seen.add(code);
        codes.push({ code, description: m[2].replace(/_/g, ' '), isError: parseInt(code) >= 400 });
      }
    }
    // Also catch "Returns 404" pattern
    const returnMatches = why.matchAll(/[Rr]eturns?\s+(\d{3})/g);
    for (const m of returnMatches) {
      const code = m[1];
      if (!seen.has(code)) {
        seen.add(code);
        codes.push({ code, description: `Error`, isError: parseInt(code) >= 400 });
      }
    }
  }

  return codes;
}

export function ApiList({ groups }: ApiListProps) {
  const totalEndpoints = groups.reduce((sum, g) => sum + g.endpoints.length, 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h1 className={styles.title}>Nessi API</h1>
          <span className={styles.version}>v1</span>
        </div>
        <p className={styles.subtitle}>
          {totalEndpoints} endpoints across {groups.length} groups
        </p>
        <div className={styles.baseUrl}>
          <span className={styles.baseLabel}>Base URL</span>
          <code className={styles.baseValue}>nessifishingsupply.com</code>
        </div>
      </div>

      {/* Table of contents */}
      <nav className={styles.toc}>
        {groups.map((group) => (
          <a key={group.name} href={`#${slugify(group.name)}`} className={styles.tocItem}>
            <span className={styles.tocName}>{group.name}</span>
            <span className={styles.tocCount}>{group.endpoints.length}</span>
          </a>
        ))}
      </nav>

      {/* Groups */}
      {groups.map((group) => (
        <div key={group.name} id={slugify(group.name)} className={styles.group}>
          <div className={styles.groupHeader}>
            <h2 className={styles.groupName}>{group.name}</h2>
            <span className={styles.groupCount}>{group.endpoints.length} endpoints</span>
          </div>
          <div className={styles.endpoints}>
            {group.endpoints.map((ep) => (
              <EndpointCard
                key={`${ep.method}-${ep.path}`}
                endpoint={ep}
                groupName={group.name}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
