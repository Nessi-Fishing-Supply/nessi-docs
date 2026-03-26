'use client';

import { useState, type ReactNode } from 'react';
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
];

interface AppShellProps {
  topbar: ReactNode;
  sidebar: ReactNode;
  detail: ReactNode;
  children: ReactNode;
}

export function AppShell({ topbar, sidebar, detail, children }: AppShellProps) {
  const pathname = usePathname();
  const [manualOverride, setManualOverride] = useState<{ path: string; value: boolean } | null>(
    null,
  );

  const pageSupportsDetail =
    DETAIL_PANEL_PAGES.some((p) => pathname.startsWith(p)) &&
    !pathname.startsWith('/data-model/erd');

  // Override only applies to the page it was set on
  const activeOverride = manualOverride?.path === pathname ? manualOverride.value : null;

  const detailCollapsed = activeOverride !== null ? !activeOverride : !pageSupportsDetail;

  return (
    <div className={`${styles.shell} ${detailCollapsed ? styles.collapsed : ''}`}>
      <header className={styles.topbar}>{topbar}</header>
      <nav className={styles.sidebar}>{sidebar}</nav>
      <main className={styles.main}>{children}</main>
      <aside className={styles.detail}>{detail}</aside>

      {/* Toggle sits on the shell grid, not inside main, so overflow:hidden doesn't clip it */}
      <button
        className={styles.detailToggle}
        onClick={() =>
          setManualOverride((prev) => {
            const current = prev?.path === pathname ? prev.value : null;
            const next = current !== null ? !current : pageSupportsDetail ? false : true;
            return { path: pathname, value: next };
          })
        }
        aria-label={detailCollapsed ? 'Show detail panel' : 'Hide detail panel'}
      >
        <span className={styles.toggleArrow}>{detailCollapsed ? '‹' : '›'}</span>
      </button>
    </div>
  );
}
