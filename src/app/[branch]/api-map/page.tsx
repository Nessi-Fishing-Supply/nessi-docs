import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { ApiList } from '@/features/api-map/api-list';

export const metadata = { title: 'API Map' };

export default async function ApiMapPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  const totalEndpoints = data.apiGroups.reduce((sum, g) => sum + g.endpoints.length, 0);

  return <ApiList groups={data.apiGroups} totalEndpoints={totalEndpoints} />;
}
