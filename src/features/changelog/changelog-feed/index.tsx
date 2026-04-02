'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ChangelogEntry } from '@/types/changelog';
import { CHANGE_TYPE_CONFIG } from '@/types/changelog';
import { getDomainForScope } from '@/data';
import { DOMAINS } from '@/constants/domains';
import { useBranchHref } from '@/providers/branch-provider';
import { formatDate } from '@/constants/dates';
import { PageHeader } from '@/components/ui/page-header';
import { Tooltip } from '@/components/data-display';
import styles from './changelog-feed.module.scss';

/** Normalize duplicate scope names to a single display label. */
const SCOPE_ALIASES: Record<string, string> = {
  db: 'database',
  database: 'database',
};

interface ChangelogFeedProps {
  entries: ChangelogEntry[];
}

export function ChangelogFeed({ entries }: ChangelogFeedProps) {
  const branchHref = useBranchHref();
  const searchParams = useSearchParams();
  const domainFilter = searchParams.get('domain');

  const filtered = domainFilter
    ? entries
        .map((entry) => ({
          ...entry,
          changes: (entry.changes ?? []).filter((c) => {
            const domain = c.area ? getDomainForScope(c.area) : undefined;
            return domain === domainFilter;
          }),
        }))
        .filter((entry) => (entry.changes?.length ?? 0) > 0)
    : entries;

  const totalChanges = filtered.reduce((sum, e) => sum + (e.changes?.length ?? 0), 0);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Changelog"
        metrics={[
          { value: totalChanges, label: 'changes' },
          { value: filtered.length, label: 'releases' },
        ]}
      />

      <div className={styles.filterBar}>
        <Link
          href={branchHref('/changelog')}
          className={`${styles.filterChip} ${!domainFilter ? styles.filterChipActive : ''}`}
        >
          All
        </Link>
        {DOMAINS.map((d) => (
          <Link
            key={d.slug}
            href={branchHref(`/changelog?domain=${d.slug}`)}
            className={`${styles.filterChip} ${domainFilter === d.slug ? styles.filterChipActive : ''}`}
          >
            {d.label}
          </Link>
        ))}
      </div>

      <div className={styles.timeline}>
        {filtered.map((entry) => (
          <div key={entry.date} className={styles.entry}>
            <div className={styles.dot} />
            <div className={styles.entryHeader}>
              <span className={styles.date}>{formatDate(entry.date ?? '')}</span>
              <span className={styles.changeCount}>{entry.changes?.length ?? 0} changes</span>
            </div>
            <ul className={styles.changeList}>
              {(entry.changes ?? []).map((change, i) => {
                const config = CHANGE_TYPE_CONFIG[change.type];
                const rawArea = change.area;
                const displayArea = rawArea ? (SCOPE_ALIASES[rawArea] ?? rawArea) : undefined;
                const domain = rawArea ? getDomainForScope(rawArea) : undefined;

                return (
                  <li key={i} className={styles.changeItem}>
                    <span
                      className={styles.badge}
                      style={{ borderColor: config.color, color: config.color }}
                    >
                      {config.label}
                    </span>
                    <span className={styles.description}>{change.description}</span>
                    {displayArea && domain ? (
                      <Link href={branchHref(`/features/${domain}`)} className={styles.area}>
                        {displayArea}
                      </Link>
                    ) : displayArea && displayArea !== 'general' ? (
                      <Tooltip text="This scope doesn't map to a feature domain — it's a cross-cutting concern.">
                        <span className={styles.areaMuted}>{displayArea}</span>
                      </Tooltip>
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

        {filtered.length === 0 && (
          <div className={styles.emptyState}>No changes found for this domain.</div>
        )}
      </div>
    </div>
  );
}
