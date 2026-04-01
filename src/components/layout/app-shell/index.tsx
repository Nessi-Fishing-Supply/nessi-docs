'use client';

import { type ReactNode, useState, useEffect, useRef } from 'react';
import { useBranchData } from '@/providers/branch-provider';
import styles from './app-shell.module.scss';

interface AppShellProps {
  topbar: ReactNode;
  sidebar: ReactNode;
  detail: ReactNode;
  children: ReactNode;
}

export function AppShell({ topbar, sidebar, detail, children }: AppShellProps) {
  const { activeBranch } = useBranchData();
  const [fading, setFading] = useState(false);
  const prevBranch = useRef(activeBranch);

  useEffect(() => {
    if (prevBranch.current !== activeBranch) {
      setFading(true);
      const timer = setTimeout(() => setFading(false), 300);
      prevBranch.current = activeBranch;
      return () => clearTimeout(timer);
    }
  }, [activeBranch]);

  return (
    <div className={`${styles.shell} ${styles.collapsed}`}>
      <header className={styles.topbar}>{topbar}</header>
      <nav className={styles.sidebar}>{sidebar}</nav>
      <main className={`${styles.main} ${fading ? styles.fading : ''}`}>{children}</main>
      <aside className={styles.detail}>{detail}</aside>
    </div>
  );
}
