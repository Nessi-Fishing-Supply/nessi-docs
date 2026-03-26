import { features } from '@/data';
import { FeatureList } from '@/features/feature-readiness/feature-list';

export const metadata = { title: 'Features' };

export default function FeaturesPage() {
  return <FeatureList features={features} />;
}
