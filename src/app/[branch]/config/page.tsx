import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { getConfigEnums, getRoles, ConfigList } from '@/features/config';

export const metadata = { title: 'Config' };

export default async function ConfigPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  if (!loadBranch(branch)) notFound();

  const enums = getConfigEnums(branch);
  const roles = getRoles(branch);

  return (
    <Suspense>
      <ConfigList enums={enums} roles={roles} />
    </Suspense>
  );
}
