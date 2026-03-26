import styles from './staleness-banner.module.scss';

// Import directly from generated JSON to avoid dependency on index.ts changes
import meta from '@/data/generated/_meta.json';

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function StalenessBanner() {
  const extractedAt = new Date(meta.extractedAt);
  const age = Date.now() - extractedAt.getTime();
  if (age <= STALE_THRESHOLD_MS) return null;

  const daysAgo = Math.floor(age / (24 * 60 * 60 * 1000));
  return (
    <div className={styles.banner}>
      Data last synced {daysAgo} days ago from <code>{meta.sourceCommit}</code>. Pipeline may need
      attention.
    </div>
  );
}
