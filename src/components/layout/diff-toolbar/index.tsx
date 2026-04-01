'use client';

import { usePathname } from 'next/navigation';
import { useBranchData } from '@/providers/branch-provider';
import { useDiffMode } from '@/hooks/use-diff-mode';
import styles from './diff-toolbar.module.scss';

/** Map URL path segments to diff summary domain keys. */
const PATH_TO_DOMAIN: Record<string, string> = {
  'data-model': 'entities',
  'api-map': 'apiGroups',
  lifecycles: 'lifecycles',
  architecture: 'archDiagrams',
  config: 'configEnums',
  'entity-relationships': 'erdNodes',
  features: 'features',
};

function getPageDomain(pathname: string): string | null {
  // pathname is like /main/data-model or /staging/api-map
  const segments = pathname.split('/').filter(Boolean);
  const pageSegment = segments[1]; // after branch segment
  return pageSegment ? (PATH_TO_DOMAIN[pageSegment] ?? null) : null;
}

export function DiffToolbar() {
  const { branches } = useBranchData();
  const pathname = usePathname();
  const { isActive, compareBranch, diffResult, deactivate } = useDiffMode();

  if (!isActive || !diffResult) return null;

  const branchLabel = branches.find((b) => b.name === compareBranch)?.label ?? compareBranch;

  // Show page-specific counts when on a list view, global counts otherwise
  const domain = getPageDomain(pathname);
  const domainCounts = domain ? diffResult.summary.byDomain[domain] : null;
  const added = domainCounts?.added ?? diffResult.summary.added;
  const modified = domainCounts?.modified ?? diffResult.summary.modified;
  const removed = domainCounts?.removed ?? diffResult.summary.removed;

  return (
    <div className={styles.toolbar}>
      <span className={styles.label}>
        Comparing against <strong>{branchLabel}</strong>
      </span>

      <div className={styles.counts}>
        <span className={styles.countAdded}>
          <span className={styles.dot} /> {added} added
        </span>
        <span className={styles.separator}>&middot;</span>
        <span className={styles.countModified}>
          <span className={styles.dot} /> {modified} modified
        </span>
        <span className={styles.separator}>&middot;</span>
        <span className={styles.countRemoved}>
          <span className={styles.dot} /> {removed} removed
        </span>
      </div>

      <button className={styles.dismissBtn} onClick={deactivate} aria-label="Exit comparison mode">
        &times;
      </button>
    </div>
  );
}
