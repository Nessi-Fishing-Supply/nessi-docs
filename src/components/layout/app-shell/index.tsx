'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import styles from './app-shell.module.scss';

// Pages that support detail panel selection
const DETAIL_PANEL_PAGES = [
  '/journeys',
  '/api-map',
  '/data-model',
  '/lifecycles',
  '/coverage',
  '/features',
  '/permissions',
  '/config',
];

interface AppShellProps {
  topbar: ReactNode;
  sidebar: ReactNode;
  detail: ReactNode;
  children: ReactNode;
}

export function AppShell({ topbar, sidebar, detail, children }: AppShellProps) {
  const pathname = usePathname();
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);

  const pageSupportsDetail = DETAIL_PANEL_PAGES.some((p) => pathname.startsWith(p))
    && !pathname.startsWith('/data-model/erd');

  // Reset manual override when navigating to a different page
  useEffect(() => {
    setManualOverride(null);
  }, [pathname]);

  const detailCollapsed = manualOverride !== null ? !manualOverride : !pageSupportsDetail;

  return (
    <div className={`${styles.shell} ${detailCollapsed ? styles.collapsed : ''}`}>
      <header className={styles.topbar}>{topbar}</header>
      <nav className={styles.sidebar}>{sidebar}</nav>
      <main className={styles.main}>{children}</main>
      <aside className={styles.detail}>{detail}</aside>

      {/* Toggle sits on the shell grid, not inside main, so overflow:hidden doesn't clip it */}
      <button
        className={styles.detailToggle}
        onClick={() => setManualOverride((prev) => prev !== null ? !prev : pageSupportsDetail ? false : true)}
        aria-label={detailCollapsed ? 'Show detail panel' : 'Hide detail panel'}
      >
        <span className={styles.toggleArrow}>
          {detailCollapsed ? '‹' : '›'}
        </span>
      </button>
    </div>
  );
}
