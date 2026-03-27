'use client';

import type { ChangelogEntry } from '@/types/changelog';
import { CHANGE_TYPE_CONFIG } from '@/types/changelog';
import { PageHeader } from '@/components/ui/page-header';
import styles from './changelog-feed.module.scss';

interface ChangelogFeedProps {
  entries: ChangelogEntry[];
}

export function ChangelogFeed({ entries }: ChangelogFeedProps) {
  const totalChanges = entries.reduce((sum, e) => sum + (e.changes?.length ?? 0), 0);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Changelog"
        metrics={[
          { value: totalChanges, label: 'changes' },
          { value: entries.length, label: 'releases' },
        ]}
      />

      <div className={styles.timeline}>
        {entries.map((entry) => (
          <div key={entry.date} className={styles.entry}>
            <div className={styles.dot} />
            <div className={styles.entryHeader}>
              <span className={styles.date}>{entry.date}</span>
              <span className={styles.changeCount}>{entry.changes?.length ?? 0} changes</span>
            </div>
            <ul className={styles.changeList}>
              {(entry.changes ?? []).map((change, i) => {
                const config = CHANGE_TYPE_CONFIG[change.type];
                return (
                  <li key={i} className={styles.changeItem}>
                    <span
                      className={styles.badge}
                      style={{ borderColor: config.color, color: config.color }}
                    >
                      {config.label}
                    </span>
                    <span className={styles.description}>{change.description}</span>
                    {change.area && <span className={styles.area}>{change.area}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
