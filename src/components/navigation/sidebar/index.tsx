'use client';

import { Suspense, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineHome,
  HiOutlineMap,
  HiOutlineServer,
  HiOutlineDatabase,
  HiOutlineLink,
  HiOutlineRefresh,
  HiOutlineLightningBolt,
  HiOutlineCog,
  HiOutlineClock,
  HiOutlineChip,
  HiOutlineSwitchHorizontal,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
} from 'react-icons/hi';
import { useDiffResult } from '@/features/diff-overview';
import { FEATURE_TO_DOMAIN } from '@/data/transforms/features';
import type { Lifecycle } from '@/types/lifecycle';
import { useBranchHref } from '@/hooks/use-branch-href';
import { useAppStore } from '@/stores/app-store';
import styles from './sidebar.module.scss';

const SYSTEM_ITEMS = [
  { id: 'journeys', label: 'Journeys', icon: HiOutlineMap, path: '/journeys' },
  { id: 'api', label: 'API Map', icon: HiOutlineServer, path: '/api-map' },
  { id: 'data', label: 'Data Model', icon: HiOutlineDatabase, path: '/data-model' },
  { id: 'erd', label: 'Relationships', icon: HiOutlineLink, path: '/entity-relationships' },
  { id: 'lifecycles', label: 'Lifecycles', icon: HiOutlineRefresh, path: '/lifecycles' },
  { id: 'architecture', label: 'Architecture', icon: HiOutlineChip, path: '/architecture' },
];

const REFERENCE_ITEMS = [
  { id: 'config', label: 'Config', icon: HiOutlineCog, path: '/config' },
  { id: 'changelog', label: 'Changelog', icon: HiOutlineClock, path: '/changelog' },
];

const NAV_TO_DOMAIN: Record<string, string> = {
  journeys: 'journeys',
  api: 'apiGroups',
  data: 'entities',
  erd: 'erdNodes',
  lifecycles: 'lifecycles',
  architecture: 'archDiagrams',
  config: 'configEnums',
};

/* ------------------------------------------------------------------ */
/*  Compact viewport detection (for overlay behavior)                  */
/* ------------------------------------------------------------------ */

function useIsCompact() {
  // SSR-safe: default to false, update after mount
  const ref = useRef(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1279px)');
    ref.current = mql.matches;
    const handler = (e: MediaQueryListEvent) => {
      ref.current = e.matches;
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return ref;
}

/* ------------------------------------------------------------------ */
/*  Diff sub-components (unchanged from current)                       */
/* ------------------------------------------------------------------ */

function DiffNavItem() {
  const branchHref = useBranchHref();
  const pathname = usePathname();
  const { isActive } = useDiffResult();

  if (!isActive) return null;

  const isOnDiffPage = pathname.endsWith('/diff');

  return (
    <Link
      href={branchHref('/diff')}
      className={`${styles.navItem} ${styles.diffNavItem} ${isOnDiffPage ? styles.active : ''}`}
    >
      <HiOutlineSwitchHorizontal className={styles.navIcon} />
      <span className={styles.navLabel}>Compare Overview</span>
    </Link>
  );
}

interface DomainDots {
  added: number;
  modified: number;
  removed: number;
}

interface DiffNavData {
  dots: Map<string, DomainDots>;
  isDiffMode: boolean;
  featureDomainDots: Map<string, DomainDots>;
}

function DiffDots({ children }: { children: (data: DiffNavData) => React.ReactNode }) {
  const { isActive, diffResult } = useDiffResult();

  const dots = useMemo(() => {
    const map = new Map<string, DomainDots>();
    if (!isActive || !diffResult) return map;
    for (const [navId, domainKey] of Object.entries(NAV_TO_DOMAIN)) {
      const domain = diffResult.summary.byDomain[domainKey];
      if (!domain) continue;
      if (domain.added > 0 || domain.modified > 0 || domain.removed > 0) {
        map.set(navId, domain);
      }
    }
    return map;
  }, [isActive, diffResult]);

  const featureDomainDots = useMemo(() => {
    const map = new Map<string, DomainDots>();
    if (!isActive || !diffResult) return map;
    const bump = (domain: string, key: 'added' | 'modified' | 'removed') => {
      const prev = map.get(domain) ?? { added: 0, modified: 0, removed: 0 };
      prev[key]++;
      map.set(domain, prev);
    };
    for (const f of diffResult.features.added) {
      const domain = FEATURE_TO_DOMAIN[f.slug];
      if (domain) bump(domain, 'added');
    }
    for (const f of diffResult.features.removed) {
      const domain = FEATURE_TO_DOMAIN[f.slug];
      if (domain) bump(domain, 'removed');
    }
    for (const m of diffResult.features.modified) {
      const domain = FEATURE_TO_DOMAIN[m.head.slug];
      if (domain) bump(domain, 'modified');
    }
    return map;
  }, [isActive, diffResult]);

  return <>{children({ dots, isDiffMode: isActive, featureDomainDots })}</>;
}

function DiffIndicator({ counts }: { counts: DomainDots }) {
  return (
    <span className={styles.diffDots}>
      {counts.added > 0 && <span className={styles.diffDotAdded} />}
      {counts.modified > 0 && <span className={styles.diffDotModified} />}
      {counts.removed > 0 && <span className={styles.diffDotRemoved} />}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav Content                                                        */
/* ------------------------------------------------------------------ */

interface NavContentProps {
  dots: Map<string, DomainDots>;
  isDiffMode: boolean;
  featureDomainDots: Map<string, DomainDots>;
  pathname: string;
  branchPrefix: string;
  branchHref: (path: string) => string;
  featureDomains: { slug: string; label: string }[];
  collapsed: boolean;
  onNavClick: () => void;
}

function NavContent({
  dots,
  isDiffMode,
  featureDomainDots,
  pathname,
  branchPrefix,
  branchHref,
  featureDomains,
  collapsed,
  onNavClick,
}: NavContentProps) {
  const visibleSystemItems = isDiffMode
    ? SYSTEM_ITEMS.filter((item) => dots.has(item.id))
    : SYSTEM_ITEMS;

  const visibleFeatureDomains = isDiffMode
    ? featureDomains.filter((d) => featureDomainDots.has(d.slug))
    : featureDomains;

  const visibleReferenceItems = isDiffMode
    ? REFERENCE_ITEMS.filter((item) => dots.has(item.id))
    : REFERENCE_ITEMS;

  const isDashboardActive = pathname === branchPrefix || pathname === `${branchPrefix}/`;

  return (
    <>
      {!isDiffMode && (
        <Link
          href={branchHref('/')}
          className={`${styles.navItem} ${isDashboardActive ? styles.active : ''}`}
          title={collapsed ? 'Dashboard' : undefined}
          onClick={onNavClick}
        >
          <HiOutlineHome className={styles.navIcon} />
          <span className={styles.navLabel}>Dashboard</span>
        </Link>
      )}

      {isDiffMode && <DiffNavItem />}

      {visibleSystemItems.length > 0 && (
        <>
          {collapsed ? (
            <div className={styles.sectionDivider} />
          ) : (
            <div className={styles.sectionLabel}>System Views</div>
          )}
          <div className={styles.nav}>
            {visibleSystemItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(`${branchPrefix}${item.path}`);
              const counts = dots.get(item.id);
              return (
                <Link
                  key={item.id}
                  href={branchHref(item.path)}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavClick}
                >
                  <Icon className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                  {counts && <DiffIndicator counts={counts} />}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {visibleFeatureDomains.length > 0 && (
        <>
          {collapsed ? (
            <div className={styles.sectionDivider} />
          ) : (
            <div className={styles.sectionLabel}>Features</div>
          )}
          <div className={styles.nav}>
            {visibleFeatureDomains.map((domain) => {
              const isActive = pathname.startsWith(`${branchPrefix}/features/${domain.slug}`);
              const fdCounts = featureDomainDots.get(domain.slug);
              return (
                <Link
                  key={domain.slug}
                  href={branchHref(`/features/${domain.slug}`)}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  title={collapsed ? domain.label : undefined}
                  onClick={onNavClick}
                >
                  <HiOutlineLightningBolt className={styles.navIcon} />
                  <span className={styles.navLabel}>{domain.label}</span>
                  {fdCounts && <DiffIndicator counts={fdCounts} />}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {visibleReferenceItems.length > 0 && (
        <>
          {collapsed ? (
            <div className={styles.sectionDivider} />
          ) : (
            <div className={styles.sectionLabel}>Reference</div>
          )}
          <div className={styles.nav}>
            {visibleReferenceItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(`${branchPrefix}${item.path}`);
              const counts = dots.get(item.id);
              return (
                <Link
                  key={item.id}
                  href={branchHref(item.path)}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavClick}
                >
                  <Icon className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                  {counts && <DiffIndicator counts={counts} />}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  lifecycles: Lifecycle[];
  featureDomains: { slug: string; label: string }[];
}

export function Sidebar({ featureDomains }: SidebarProps) {
  const pathname = usePathname();
  const activeBranch = useAppStore.use.activeBranch();
  const branchHref = useBranchHref();
  const branchPrefix = `/${activeBranch}`;
  const sidebarCollapsed = useAppStore.use.sidebarCollapsed();
  const toggleSidebar = useAppStore.getState().toggleSidebar;
  const isCompactRef = useIsCompact();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // At compact viewport, auto-collapse when a nav item is clicked
  const handleNavClick = useCallback(() => {
    if (isCompactRef.current && !sidebarCollapsed) {
      toggleSidebar();
    }
  }, [sidebarCollapsed, toggleSidebar, isCompactRef]);

  // Close sidebar overlay when clicking outside (compact + expanded)
  useEffect(() => {
    if (sidebarCollapsed || !isCompactRef.current) return;

    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        toggleSidebar();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sidebarCollapsed, toggleSidebar, isCompactRef]);

  return (
    <div
      ref={sidebarRef}
      className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : styles.expanded}`}
    >
      <div className={styles.navContent}>
        <Suspense
          fallback={
            <NavContent
              dots={new Map()}
              isDiffMode={false}
              featureDomainDots={new Map()}
              pathname={pathname}
              branchPrefix={branchPrefix}
              branchHref={branchHref}
              featureDomains={featureDomains}
              collapsed={sidebarCollapsed}
              onNavClick={handleNavClick}
            />
          }
        >
          <DiffDots>
            {({ dots, isDiffMode: diffActive, featureDomainDots: fdd }) => (
              <NavContent
                dots={dots}
                isDiffMode={diffActive}
                featureDomainDots={fdd}
                pathname={pathname}
                branchPrefix={branchPrefix}
                branchHref={branchHref}
                featureDomains={featureDomains}
                collapsed={sidebarCollapsed}
                onNavClick={handleNavClick}
              />
            )}
          </DiffDots>
        </Suspense>
      </div>

      <button
        className={styles.collapseToggle}
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <HiOutlineChevronRight className={styles.collapseIcon} />
        ) : (
          <HiOutlineChevronLeft className={styles.collapseIcon} />
        )}
      </button>
    </div>
  );
}
