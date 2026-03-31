'use client';

import { type ReactNode } from 'react';
import styles from './app-shell.module.scss';

interface AppShellProps {
  topbar: ReactNode;
  sidebar: ReactNode;
  detail: ReactNode;
  children: ReactNode;
}

export function AppShell({ topbar, sidebar, detail, children }: AppShellProps) {
  return (
    <div className={`${styles.shell} ${styles.collapsed}`}>
      <header className={styles.topbar}>{topbar}</header>
      <nav className={styles.sidebar}>{sidebar}</nav>
      <main className={styles.main}>{children}</main>
      <aside className={styles.detail}>{detail}</aside>
    </div>
  );
}
