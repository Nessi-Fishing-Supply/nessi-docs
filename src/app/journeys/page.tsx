import { getDomains } from '@/data';
import { DomainGrid } from '@/features/journeys/domain-grid';

export default function JourneysIndex() {
  const domains = getDomains();
  return <DomainGrid domains={domains} />;
}
