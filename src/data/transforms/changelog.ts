import type {
  ChangelogEntry,
  ChangelogChange,
  ChangeType,
} from '@/features/changelog/types/changelog';

const TYPE_TO_CHANGE_TYPE: Record<string, ChangeType> = {
  feature: 'added',
  fix: 'fixed',
  refactor: 'changed',
  chore: 'changed',
  docs: 'changed',
};

export function transformChangelog(
  raw: {
    title?: string;
    mergedAt?: string;
    type?: string;
    area?: string;
    number?: number;
    url?: string;
  }[],
): ChangelogEntry[] {
  // Group entries by date (YYYY-MM-DD from mergedAt)
  const byDate = new Map<string, ChangelogChange[]>();

  for (const entry of raw) {
    const date = entry.mergedAt ? entry.mergedAt.slice(0, 10) : 'unknown';
    if (!byDate.has(date)) byDate.set(date, []);

    // Strip conventional commit prefix for cleaner description
    const description = (entry.title ?? '')
      .replace(
        /^(feat|fix|chore|refactor|docs|style|test|perf|ci|build|revert)(\([^)]*\))?:\s*/i,
        '',
      )
      .replace(/^#\d+\s*/, '');

    byDate.get(date)!.push({
      type: TYPE_TO_CHANGE_TYPE[entry.type ?? ''] ?? 'changed',
      description: description || entry.title || 'No description',
      area: entry.area,
      prNumber: entry.number,
      prUrl: entry.url,
    });
  }

  // Sort dates descending and return as ChangelogEntry[]
  return [...byDate.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, changes]) => ({ date, changes }));
}
