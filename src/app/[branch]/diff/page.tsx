import { Suspense } from 'react';
import { DiffOverviewView } from '@/features/diff-overview/diff-overview-view';

export const metadata = { title: 'Compare Overview' };

export default function DiffPage() {
  return (
    <Suspense>
      <DiffOverviewView />
    </Suspense>
  );
}
