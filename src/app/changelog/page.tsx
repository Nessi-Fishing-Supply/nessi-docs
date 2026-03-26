import { changelog } from '@/data';
import { ChangelogFeed } from '@/features/changelog/changelog-feed';

export const metadata = { title: 'Changelog' };

export default function ChangelogPage() {
  return <ChangelogFeed entries={changelog} />;
}
