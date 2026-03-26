'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HiOutlineMap,
  HiOutlineServer,
  HiOutlineDatabase,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiOutlinePuzzle,
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineCog,
  HiOutlineClock,
} from 'react-icons/hi';
import type { Lifecycle } from '@/types/lifecycle';
import styles from './sidebar.module.scss';

const NAV_ITEMS = [
  { id: 'journeys', label: 'Journeys', icon: HiOutlineMap, href: '/journeys' },
  { id: 'api', label: 'API Map', icon: HiOutlineServer, href: '/api-map' },
  { id: 'data', label: 'Data Model', icon: HiOutlineDatabase, href: '/data-model' },
  { id: 'lifecycles', label: 'Lifecycles', icon: HiOutlineRefresh, href: '/lifecycles' },
  { id: 'coverage', label: 'Coverage', icon: HiOutlineChartBar, href: '/coverage' },
  { id: 'features', label: 'Features', icon: HiOutlinePuzzle, href: '/features' },
  { id: 'permissions', label: 'Permissions', icon: HiOutlineShieldCheck, href: '/permissions' },
  { id: 'errors', label: 'Errors', icon: HiOutlineExclamationCircle, href: '/errors' },
  { id: 'config', label: 'Config', icon: HiOutlineCog, href: '/config' },
  { id: 'changelog', label: 'Changelog', icon: HiOutlineClock, href: '/changelog' },
];

interface SidebarProps {
  lifecycles: Lifecycle[];
}

export function Sidebar({ lifecycles }: SidebarProps) {
  const pathname = usePathname();

  const activePage = NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.id;

  const showLifecycleSubnav = activePage === 'lifecycles';

  return (
    <div className={styles.sidebar}>
      <div className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon className={styles.navIcon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {showLifecycleSubnav && (
        <>
          <div className={styles.divider} />
          <div className={styles.subnavLabel}>Lifecycles</div>
          <div className={styles.subnav}>
            {lifecycles.map((l) => {
              const isActive = pathname === `/lifecycles/${l.slug}`;
              return (
                <Link
                  key={l.slug}
                  href={`/lifecycles/${l.slug}`}
                  className={`${styles.subnavItem} ${isActive ? styles.active : ''}`}
                >
                  <span className={styles.badge}>{l.badge}</span>
                  <span>{l.name}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
