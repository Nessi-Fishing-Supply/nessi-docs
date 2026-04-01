import { notFound } from 'next/navigation';
import { loadBranch } from '@/data/branch-loader';
import { ConfigList } from '@/features/config/config-list';

export const metadata = { title: 'Config' };

export default async function ConfigPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const data = loadBranch(branch);
  if (!data) notFound();

  return <ConfigList enums={data.configEnums} roles={data.roles} />;
}
