import { redirect } from 'next/navigation';
import { getDefaultBranch } from '@/data/branch-registry';

export default function RootPage() {
  redirect(`/${getDefaultBranch().name}/`);
}
