'use client';

import { useSyncExternalStore } from 'react';
import styles from './staleness-banner.module.scss';

// Import directly from generated JSON to avoid dependency on index.ts changes
import meta from '@/data/generated/_meta.json';

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Computed once at module load — stable for the lifetime of the build/session
const extractedAt = new Date(meta.extractedAt).getTime();

export function StalenessBanner() {
  // useSyncExternalStore to read a non-React time source without calling Date.now() in render
  const age = useSyncExternalStore(
    subscribeNoop,
    () => Date.now() - extractedAt,
    () => Date.now() - extractedAt,
  );

  if (age <= STALE_THRESHOLD_MS) return null;

  const daysAgo = Math.floor(age / MS_PER_DAY);
  return (
    <div className={styles.banner}>
      Data last synced {daysAgo} days ago from <code>{meta.sourceCommit}</code>. Pipeline may need
      attention.
    </div>
  );
}

// No-op subscriber — age only needs to be accurate on mount, not live-updating
function subscribeNoop(cb: () => void) {
  void cb;
  return () => {};
}
