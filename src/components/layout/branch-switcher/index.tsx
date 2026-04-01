'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useBranchData } from '@/providers/branch-provider';
import { useToast } from '@/components/ui/toast';
import styles from './branch-switcher.module.scss';

export function BranchSwitcher() {
  const { activeBranch, branches } = useBranchData();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = branches.find((b) => b.name === activeBranch);

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

  function handleSwitch(branchName: string) {
    if (branchName === activeBranch) {
      setOpen(false);
      return;
    }
    const target = branches.find((b) => b.name === branchName);
    // Replace branch segment in current path
    const pathWithoutBranch = pathname.replace(`/${activeBranch}`, '') || '/';
    router.push(`/${branchName}${pathWithoutBranch}`);
    showToast(`Switched to ${target?.label ?? branchName}`, target?.color);
    setOpen(false);
  }

  return (
    <div className={styles.switcher} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={styles.dot} style={{ background: current?.color }} />
        <span className={styles.label}>{current?.label ?? activeBranch}</span>
        <svg
          className={`${styles.chevron} ${open ? styles.open : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 5L6 2L9 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox">
          {branches.map((b) => (
            <button
              key={b.name}
              className={`${styles.option} ${b.name === activeBranch ? styles.active : ''}`}
              onClick={() => handleSwitch(b.name)}
              role="option"
              aria-selected={b.name === activeBranch}
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
  );
}
