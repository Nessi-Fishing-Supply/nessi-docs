'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useUrlSync } from '@/hooks/use-url-sync';
import styles from './diff-empty-state.module.scss';

export function DiffEmptyState() {
  const activeBranch = useAppStore.use.activeBranch();
  const branches = useAppStore.use.branches();
  const { activateDiff } = useUrlSync();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const otherBranches = branches.filter((b) => b.name !== activeBranch);

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

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M16 12v24M32 12v24M8 24h32"
              stroke="var(--text-dim)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className={styles.heading}>Compare Branches</h2>
        <p className={styles.subtext}>
          Select a branch to see what changed — entities, endpoints, journeys, and more.
        </p>

        <div className={styles.selector} ref={ref}>
          <button className={styles.selectorBtn} onClick={() => setOpen(!open)}>
            Choose a branch to compare against...
          </button>

          {open && (
            <div className={styles.dropdown}>
              {otherBranches.map((b) => (
                <button
                  key={b.name}
                  className={styles.option}
                  onClick={() => {
                    activateDiff(b.name);
                    setOpen(false);
                  }}
                >
                  <span className={styles.dot} style={{ background: b.color }} />
                  <div className={styles.optionText}>
                    <span className={styles.optionLabel}>{b.label}</span>
                    <span className={styles.optionDesc}>{b.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
