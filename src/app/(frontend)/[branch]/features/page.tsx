import { redirect } from 'next/navigation';

export default async function FeaturesIndex({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  redirect(`/${branch}/`);
}
