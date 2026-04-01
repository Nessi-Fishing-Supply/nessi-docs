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
  const { branches } = useBranchData();
  const branchHref = useBranchHref();
  const pathname = usePathname();
  const { isActive, compareBranch, diffResult } = useDiffMode();

  if (!isActive || !diffResult) return null;

  const branchLabel = branches.find((b) => b.name === compareBranch)?.label ?? compareBranch;
  const isOnDiffPage = pathname.endsWith('/diff');

  // Show page-specific counts when on a list view, global counts otherwise
  const domain = getPageDomain(pathname);
  const domainCounts = domain ? diffResult.summary.byDomain[domain] : null;
  const added = domainCounts?.added ?? diffResult.summary.added;
  const modified = domainCounts?.modified ?? diffResult.summary.modified;
  const removed = domainCounts?.removed ?? diffResult.summary.removed;

  const diffPageHref = branchHref('/diff');

  return (
    <div className={styles.toolbar}>
      {isOnDiffPage ? (
        <span className={styles.label}>
          Comparing against <strong>{branchLabel}</strong>
        </span>
      ) : (
        <Link href={diffPageHref} className={styles.labelLink}>
          Comparing against <strong>{branchLabel}</strong>
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
