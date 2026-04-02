'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useDiffResult } from '@/hooks/use-diff-result';
import { useUrlSync } from '@/hooks/use-url-sync';
import styles from './comparison-selector.module.scss';

export function ComparisonSelector() {
  const activeBranch = useAppStore.use.activeBranch();
  const branches = useAppStore.use.branches();
  const { isActive, compareBranch } = useDiffResult();
  const { activateDiff, deactivateDiff } = useUrlSync();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const otherBranches = branches.filter((b) => b.name !== activeBranch);
  const compareBranchInfo = branches.find((b) => b.name === compareBranch);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (isActive) {
    return (
      <div className={styles.selector} ref={ref}>
        <div className={styles.activeState}>
          <span className={styles.vsLabel}>
            vs <strong>{compareBranchInfo?.label ?? compareBranch}</strong>
          </span>
          <button
            className={styles.dismissBtn}
            onClick={deactivateDiff}
            aria-label="Exit comparison mode"
          >
            &times;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.selector} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen(!open)}>
        Compare...
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox">
          {otherBranches.map((b) => (
            <button
              key={b.name}
              className={styles.option}
              onClick={() => {
                activateDiff(b.name);
                setOpen(false);
              }}
              role="option"
              aria-selected={false}
            >
              <span className={styles.dot} style={{ background: b.color }} />
              <span className={styles.optionLabel}>{b.label}</span>
              <span className={styles.optionDesc}>{b.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
