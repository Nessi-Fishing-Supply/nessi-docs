'use client';

import Link from 'next/link';
import type { ChangelogEntry } from '@/types/changelog';
import { CHANGE_TYPE_CONFIG } from '@/types/changelog';
import { getDomainForScope } from '@/data';
import { PageHeader } from '@/components/ui/page-header';
import { Tooltip } from '@/components/ui';
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
                const domain = change.area ? getDomainForScope(change.area) : undefined;

                return (
                  <li key={i} className={styles.changeItem}>
                    <span
                      className={styles.badge}
                      style={{ borderColor: config.color, color: config.color }}
                    >
                      {config.label}
                    </span>
                    <span className={styles.description}>{change.description}</span>
                    {change.area && domain ? (
                      <Link href={`/features/${domain}`} className={styles.area}>
                        {change.area}
                      </Link>
                    ) : change.area && change.area !== 'general' ? (
                      <span className={styles.areaText}>{change.area}</span>
                    ) : (
                      <Tooltip text="This PR didn't use a scoped commit message, e.g. feat(scope): ...">
                        <span className={styles.areaUnscoped}>unscoped</span>
                      </Tooltip>
                    )}
                    {change.prUrl && (
                      <a
                        href={change.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.prLink}
                      >
                        #{change.prNumber}
                      </a>
                    )}
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
