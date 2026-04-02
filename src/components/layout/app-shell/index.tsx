'use client';

import { type ReactNode, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import styles from './app-shell.module.scss';

interface AppShellProps {
  topbar: ReactNode;
  sidebar: ReactNode;
  detail: ReactNode;
  diffToolbar?: ReactNode;
  children: ReactNode;
}

export function AppShell({ topbar, sidebar, detail, diffToolbar, children }: AppShellProps) {
  const activeBranch = useAppStore.use.activeBranch();
  const selectedItem = useAppStore.use.selectedItem();
  const clearSelection = useAppStore.getState().clearSelection;
  const mainRef = useRef<HTMLElement>(null);
  const prevBranch = useRef(activeBranch);

  const isCollapsed = !selectedItem;

  // Trigger crossfade via DOM class toggle — avoids setState-in-effect lint issue
  const refCallback = useCallback(
    (node: HTMLElement | null) => {
      mainRef.current = node;
      if (node && prevBranch.current !== activeBranch) {
        node.classList.add(styles.fading);
        const timer = setTimeout(() => node.classList.remove(styles.fading), 300);
        prevBranch.current = activeBranch;
        return () => clearTimeout(timer);
      }
    },
    [activeBranch],
  );

  return (
    <div className={`${styles.shell} ${isCollapsed ? styles.collapsed : ''}`}>
      <header className={styles.topbar}>{topbar}</header>
      <nav className={styles.sidebar}>{sidebar}</nav>
      <main ref={refCallback} className={styles.main}>
        {diffToolbar}
        <div className={styles.mainContent}>{children}</div>
      </main>
      {selectedItem && (
        <button
          className={styles.detailToggle}
          onClick={clearSelection}
          aria-label="Collapse detail panel"
        >
          <span className={styles.toggleArrow}>›</span>
        </button>
      )}
      <aside className={styles.detail}>{detail}</aside>
    </div>
  );
}
