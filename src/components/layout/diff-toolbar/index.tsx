'use client';

import { useBranchData } from '@/providers/branch-provider';
import { useDiffMode } from '@/hooks/use-diff-mode';
import styles from './diff-toolbar.module.scss';

export function DiffToolbar() {
  const { branches } = useBranchData();
  const { isActive, compareBranch, diffResult, deactivate } = useDiffMode();

  if (!isActive || !diffResult) return null;

  const branchLabel = branches.find((b) => b.name === compareBranch)?.label ?? compareBranch;
  const { added, modified, removed } = diffResult.summary;

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
