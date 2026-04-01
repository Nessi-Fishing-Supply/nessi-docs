'use client';

import { Suspense, useMemo } from 'react';
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
} from 'react-icons/hi';
import { useDiffMode } from '@/hooks/use-diff-mode';
import type { Lifecycle } from '@/types/lifecycle';
import { useBranchData, useBranchHref } from '@/providers/branch-provider';
import { BranchSwitcher } from '@/components/layout/branch-switcher';
import { ComparisonSelector } from '@/components/layout/comparison-selector';
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

function DiffNavItem() {
  const branchHref = useBranchHref();
  const pathname = usePathname();
  const { isActive } = useDiffMode();

  if (!isActive) return null;

  const isOnDiffPage = pathname.endsWith('/diff');

  return (
    <Link
      href={branchHref('/diff')}
      className={`${styles.navItem} ${styles.diffNavItem} ${isOnDiffPage ? styles.active : ''}`}
    >
      <HiOutlineSwitchHorizontal className={styles.navIcon} />
      <span>Compare Overview</span>
    </Link>
  );
}

function DiffDots({ children }: { children: (dots: Map<string, string>) => React.ReactNode }) {
  const { isActive, diffResult } = useDiffMode();

  const dots = useMemo(() => {
    const map = new Map<string, string>();
    if (!isActive || !diffResult) return map;
    for (const [navId, domainKey] of Object.entries(NAV_TO_DOMAIN)) {
      const domain = diffResult.summary.byDomain[domainKey];
      if (!domain) continue;
      if (domain.modified > 0) {
        map.set(navId, 'var(--diff-modified)');
      } else if (domain.added > 0) {
        map.set(navId, 'var(--diff-added)');
      } else if (domain.removed > 0) {
        map.set(navId, 'var(--diff-removed)');
      }
    }
    return map;
  }, [isActive, diffResult]);

  return <>{children(dots)}</>;
}

interface NavContentProps {
  dots: Map<string, string>;
  pathname: string;
  branchPrefix: string;
  branchHref: (path: string) => string;
  featureDomains: { slug: string; label: string }[];
}

function NavContent({ dots, pathname, branchPrefix, branchHref, featureDomains }: NavContentProps) {
  return (
    <>
      <div className={styles.sectionLabel}>System Views</div>
      <div className={styles.nav}>
        {SYSTEM_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(`${branchPrefix}${item.path}`);
          const dotColor = dots.get(item.id);
          return (
            <Link
              key={item.id}
              href={branchHref(item.path)}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon className={styles.navIcon} />
              <span>{item.label}</span>
              {dotColor && <span className={styles.diffDot} style={{ background: dotColor }} />}
            </Link>
          );
        })}
      </div>

      <div className={styles.sectionLabel}>Features</div>
      <div className={styles.nav}>
        {featureDomains.map((domain) => {
          const isActive = pathname.startsWith(`${branchPrefix}/features/${domain.slug}`);
          return (
            <Link
              key={domain.slug}
              href={branchHref(`/features/${domain.slug}`)}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <HiOutlineLightningBolt className={styles.navIcon} />
              <span>{domain.label}</span>
            </Link>
          );
        })}
      </div>

      <div className={styles.sectionLabel}>Reference</div>
      <div className={styles.nav}>
        {REFERENCE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(`${branchPrefix}${item.path}`);
          const dotColor = dots.get(item.id);
          return (
            <Link
              key={item.id}
              href={branchHref(item.path)}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon className={styles.navIcon} />
              <span>{item.label}</span>
              {dotColor && <span className={styles.diffDot} style={{ background: dotColor }} />}
            </Link>
          );
        })}
      </div>
    </>
  );
}

interface SidebarProps {
  lifecycles: Lifecycle[];
  featureDomains: { slug: string; label: string }[];
}

export function Sidebar({ featureDomains }: SidebarProps) {
  const pathname = usePathname();
  const { activeBranch } = useBranchData();
  const branchHref = useBranchHref();
  const branchPrefix = `/${activeBranch}`;

  const isDashboardActive = pathname === branchPrefix || pathname === `${branchPrefix}/`;

  return (
    <div className={styles.sidebar}>
      <div className={styles.navContent}>
        <Link
          href={branchHref('/')}
          className={`${styles.navItem} ${isDashboardActive ? styles.active : ''}`}
        >
          <HiOutlineHome className={styles.navIcon} />
          <span>Dashboard</span>
        </Link>

        <Suspense
          fallback={
            <NavContent
              dots={new Map()}
              pathname={pathname}
              branchPrefix={branchPrefix}
              branchHref={branchHref}
              featureDomains={featureDomains}
            />
          }
        >
          <DiffDots>
            {(dots) => (
              <NavContent
                dots={dots}
                pathname={pathname}
                branchPrefix={branchPrefix}
                branchHref={branchHref}
                featureDomains={featureDomains}
              />
            )}
          </DiffDots>
        </Suspense>
      </div>

      <div className={styles.switcherSection}>
        <div className={styles.sectionLabel}>Branch</div>
        <BranchSwitcher />
        <div className={styles.comparisonSection}>
          <Suspense>
            <ComparisonSelector />
          </Suspense>
        </div>
        <Suspense>
          <DiffNavItem />
        </Suspense>
      </div>
    </div>
  );
}
