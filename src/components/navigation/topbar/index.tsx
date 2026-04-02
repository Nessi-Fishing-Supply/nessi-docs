'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useBranchData } from '@/providers/branch-provider';
import { BranchSwitcher } from '@/components/navigation/branch-switcher';
import { ComparisonSelector } from '@/components/navigation/comparison-selector';
import styles from './topbar.module.scss';

export function Topbar() {
  const { activeBranch } = useBranchData();

  return (
    <div className={styles.topbar}>
      <Link href={`/${activeBranch}/`} className={styles.brandLink}>
        <div className={styles.brand}>
          <Image
            src="/logo_full.svg"
            alt="Nessi"
            width={68}
            height={27}
            className={styles.logo}
            priority
          />
          <span className={styles.docs}>Docs</span>
        </div>
      </Link>
      <div className={styles.controls}>
        <BranchSwitcher />
        <Suspense>
          <ComparisonSelector />
        </Suspense>
      </div>
    </div>
  );
}
