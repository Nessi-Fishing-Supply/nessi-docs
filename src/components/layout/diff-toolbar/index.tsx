'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBranchData, useBranchHref } from '@/providers/branch-provider';
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
  const segments = pathname.split('/').filter(Boolean);
  const pageSegment = segments[1];
  return pageSegment ? (PATH_TO_DOMAIN[pageSegment] ?? null) : null;
}

export function DiffToolbar() {
  const { activeBranch, branches } = useBranchData();
  const branchHref = useBranchHref();
  const pathname = usePathname();
  const { isActive, compareBranch, diffResult } = useDiffMode();

  if (!isActive || !diffResult) return null;

  const activeBranchInfo = branches.find((b) => b.name === activeBranch);
  const compareBranchInfo = branches.find((b) => b.name === compareBranch);
  const isOnDiffPage = pathname.endsWith('/diff');

  // Show page-specific counts when on a list view, global counts otherwise
  const domain = getPageDomain(pathname);
  const domainCounts = domain ? diffResult.summary.byDomain[domain] : null;
  const added = domainCounts?.added ?? diffResult.summary.added;
  const modified = domainCounts?.modified ?? diffResult.summary.modified;
  const removed = domainCounts?.removed ?? diffResult.summary.removed;

  const diffPageHref = branchHref('/diff');

  const branchLabel = (
    <span className={styles.branchComparison}>
      <span className={styles.branchBadge}>
        <span className={styles.branchDot} style={{ background: activeBranchInfo?.color }} />
        {activeBranchInfo?.label ?? activeBranch}
      </span>
      <span className={styles.vsText}>vs</span>
      <span className={styles.branchBadge}>
        <span className={styles.branchDot} style={{ background: compareBranchInfo?.color }} />
        {compareBranchInfo?.label ?? compareBranch}
      </span>
    </span>
  );

  return (
    <div className={styles.toolbar}>
      <span className={styles.modeIndicator}>COMPARE</span>

      {isOnDiffPage ? (
        <span className={styles.label}>{branchLabel}</span>
      ) : (
        <Link href={diffPageHref} className={styles.labelLink}>
          {branchLabel}
        </Link>
      )}

      <div className={styles.counts}>
        {isOnDiffPage ? (
          <>
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
          </>
        ) : (
          <>
            <Link href={`${diffPageHref}&status=added`} className={styles.countAdded}>
              <span className={styles.dot} /> {added} added
            </Link>
            <span className={styles.separator}>&middot;</span>
            <Link href={`${diffPageHref}&status=modified`} className={styles.countModified}>
              <span className={styles.dot} /> {modified} modified
            </Link>
            <span className={styles.separator}>&middot;</span>
            <Link href={`${diffPageHref}&status=removed`} className={styles.countRemoved}>
              <span className={styles.dot} /> {removed} removed
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
