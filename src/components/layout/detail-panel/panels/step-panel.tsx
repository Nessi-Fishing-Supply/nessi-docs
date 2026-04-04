'use client';

import Link from 'next/link';
import type { JourneyNode, Journey } from '@/features/journeys';
import { LAYER_CONFIG, STATUS_CONFIG } from '@/features/journeys';
import { getLinksForRoute } from '@/data';
import { useBranchHref } from '@/hooks/use-branch-href';
import { Badge } from '@/components/indicators';
import { SectionLabel } from '@/components/layout';
import { InfoBlock, CrossLink } from '@/components/data-display';
import { GitHubLink } from '@/components/data-display/github-link';
import styles from './panel-content.module.scss';

interface StepPanelProps {
  node: JourneyNode;
  journey: Journey;
}

export function StepPanel({ node, journey }: StepPanelProps) {
  const branchHref = useBranchHref();
  const layer = node.layer ? LAYER_CONFIG[node.layer] : null;
  const status = node.status ? STATUS_CONFIG[node.status] : null;
  const crossLinks = node.route ? getLinksForRoute(node.route) : [];

  return (
    <div>
      <h3 className={styles.panelTitle}>{node.label}</h3>

      <div className={styles.badgeRow}>
        {layer && <Badge color={layer.color}>{layer.label}</Badge>}
        {status && <Badge color={status.color}>{status.label}</Badge>}
      </div>

      <div className={styles.context}>{journey.title}</div>

      {node.why && (
        <>
          <SectionLabel>Why this exists</SectionLabel>
          <InfoBlock>{node.why}</InfoBlock>
        </>
      )}

      {node.route && node.layer === 'server' && (
        <>
          <SectionLabel>API Route</SectionLabel>
          <Link
            href={branchHref(
              `/api-map#${node.route
                ?.split(' ')[1]
                ?.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')}`,
            )}
            className={styles.codeBlockAccent}
          >
            {node.route} →
          </Link>
        </>
      )}

      {node.route && node.layer !== 'server' && (
        <>
          <SectionLabel>Page</SectionLabel>
          <a
            href={`https://nessifishingsupply.com${node.route}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.codeBlockAccent}
          >
            {node.route} ↗
          </a>
        </>
      )}

      {node.codeRef && (
        <>
          <SectionLabel>Code Reference</SectionLabel>
          <GitHubLink filePath={node.codeRef} />
        </>
      )}

      {node.notes && (
        <>
          <SectionLabel>Notes</SectionLabel>
          <p className={styles.description}>{node.notes}</p>
        </>
      )}

      {node.errorCases && node.errorCases.length > 0 && (
        <>
          <SectionLabel>Errors ({node.errorCases.length})</SectionLabel>
          {node.errorCases.map((err, i) => (
            <div key={i} className={styles.errorCard}>
              <div className={styles.errorCondition}>{err.condition}</div>
              <div className={styles.errorResult}>
                {err.result}
                {err.httpStatus ? ` (${err.httpStatus})` : ''}
              </div>
            </div>
          ))}
        </>
      )}

      {crossLinks.length > 0 && (
        <>
          <SectionLabel>See also</SectionLabel>
          <div className={styles.linkList}>
            {crossLinks.map((link, i) => (
              <CrossLink key={i} href={branchHref(link.href)}>
                View API Spec
              </CrossLink>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
