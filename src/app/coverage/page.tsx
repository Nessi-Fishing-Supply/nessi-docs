import { getAllJourneys } from '@/data';
import { CoverageList } from '@/features/coverage/coverage-list';

export const metadata = { title: 'Coverage' };

export default function CoveragePage() {
  return <CoverageList journeys={getAllJourneys()} />;
}
