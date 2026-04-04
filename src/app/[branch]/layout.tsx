import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/navigation/topbar';
import { Sidebar } from '@/components/navigation/sidebar';
import { DetailPanel } from '@/components/layout/detail-panel';
import { DiffToolbar } from '@/components/layout/diff-toolbar';
import { SearchTrigger } from '@/features/search/search-trigger';
import { BranchInit } from '@/libs/branch-init';
import { loadBranch, getAllBranchData } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
import { getFeatureDomains } from '@/features/feature-domain';

export function generateStaticParams() {
  return getBranchNames().map((branch) => ({ branch }));
}

export default async function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ branch: string }>;
}) {
  const { branch } = await params;
  const branchData = loadBranch(branch);
  if (!branchData) notFound();

  const allBranchData = getAllBranchData();

  const featureDomains = getFeatureDomains(branch).map((d) => ({
    slug: d.slug,
    label: d.label,
  }));

  return (
    <BranchInit branchName={branch} branchData={branchData} allBranchData={allBranchData}>
      <AppShell
        topbar={<Topbar />}
        sidebar={<Sidebar lifecycles={branchData.lifecycles} featureDomains={featureDomains} />}
        detail={<DetailPanel />}
        diffToolbar={
          <Suspense>
            <DiffToolbar />
          </Suspense>
        }
      >
        {children}
      </AppShell>
      <SearchTrigger />
    </BranchInit>
  );
}
