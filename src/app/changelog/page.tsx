import { Suspense } from 'react';
import { changelog } from '@/data';
import { ChangelogFeed } from '@/features/changelog/changelog-feed';

export const metadata = { title: 'Changelog' };

export default function ChangelogPage() {
  return (
    <Suspense>
      <ChangelogFeed entries={changelog} />
    </Suspense>
  );
}
