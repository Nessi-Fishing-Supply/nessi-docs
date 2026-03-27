'use client';

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
} from 'react-icons/hi';
import type { Lifecycle } from '@/types/lifecycle';
import styles from './sidebar.module.scss';

const SYSTEM_ITEMS = [
  { id: 'journeys', label: 'Journeys', icon: HiOutlineMap, href: '/journeys' },
  { id: 'api', label: 'API Map', icon: HiOutlineServer, href: '/api-map' },
  { id: 'data', label: 'Data Model', icon: HiOutlineDatabase, href: '/data-model' },
  { id: 'erd', label: 'Relationships', icon: HiOutlineLink, href: '/entity-relationships' },
  { id: 'lifecycles', label: 'Lifecycles', icon: HiOutlineRefresh, href: '/lifecycles' },
];

const REFERENCE_ITEMS = [
  { id: 'config', label: 'Config', icon: HiOutlineCog, href: '/config' },
  { id: 'changelog', label: 'Changelog', icon: HiOutlineClock, href: '/changelog' },
];

interface SidebarProps {
  lifecycles: Lifecycle[];
  featureDomains: { slug: string; label: string }[];
}

export function Sidebar({ featureDomains }: SidebarProps) {
  const pathname = usePathname();

  const isDashboardActive = pathname === '/';

  return (
    <div className={styles.sidebar}>
      <Link href="/" className={`${styles.navItem} ${isDashboardActive ? styles.active : ''}`}>
        <HiOutlineHome className={styles.navIcon} />
        <span>Dashboard</span>
      </Link>

      <div className={styles.sectionLabel}>System Views</div>
      <div className={styles.nav}>
        {SYSTEM_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
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

      <div className={styles.sectionLabel}>Features</div>
      <div className={styles.nav}>
        {featureDomains.map((domain) => {
          const isActive = pathname.startsWith(`/features/${domain.slug}`);
          return (
            <Link
              key={domain.slug}
              href={`/features/${domain.slug}`}
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
          const isActive = pathname.startsWith(item.href);
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
    </div>
  );
}
