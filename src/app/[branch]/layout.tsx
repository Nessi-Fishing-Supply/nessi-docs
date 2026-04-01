import { notFound } from 'next/navigation';
import { DocsProvider } from '@/providers/docs-provider';
import { BranchProvider } from '@/providers/branch-provider';
import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { Sidebar } from '@/components/layout/sidebar';
import { DetailPanel } from '@/components/layout/detail-panel';
import { SearchTrigger } from '@/features/search/search-trigger';
import { loadBranch, getAllBranchData } from '@/data/branch-loader';
import { getBranchNames } from '@/data/branch-registry';
import { getFeatureDomains } from '@/data/transforms/features';
import type { RawJourney } from '@/data/raw-types';

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

  const featureDomains = getFeatureDomains(
    branchData.features,
    branchData.journeys as unknown as RawJourney[],
  ).map((d) => ({ slug: d.slug, label: d.label }));

  return (
    <BranchProvider branchName={branch} branchData={branchData} allBranchData={allBranchData}>
      <DocsProvider>
        <AppShell
          topbar={<Topbar />}
          sidebar={<Sidebar lifecycles={branchData.lifecycles} featureDomains={featureDomains} />}
          detail={<DetailPanel />}
        >
          {children}
        </AppShell>
        <SearchTrigger />
      </DocsProvider>
    </BranchProvider>
  );
}
