'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { useDiffResult } from '@/hooks/use-diff-result';
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
  const activeBranch = useAppStore.use.activeBranch();
  const branches = useAppStore.use.branches();
  const pathname = usePathname();
  const { isActive, compareBranch, diffResult } = useDiffResult();

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

  const diffPageHref = `/${activeBranch}/diff?compare=${compareBranch}`;

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
            <span className={styles.countAdded}>New ({added})</span>
            <span className={styles.countModified}>Modified ({modified})</span>
            <span className={styles.countRemoved}>Removed ({removed})</span>
          </>
        ) : (
          <>
            <Link href={`${diffPageHref}&status=added`} className={styles.countAdded}>
              New ({added})
            </Link>
            <Link href={`${diffPageHref}&status=modified`} className={styles.countModified}>
              Modified ({modified})
            </Link>
            <Link href={`${diffPageHref}&status=removed`} className={styles.countRemoved}>
              Removed ({removed})
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
