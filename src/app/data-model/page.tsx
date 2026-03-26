import { entities } from '@/data';
import { EntityList } from '@/features/data-model/entity-list';

export const metadata = { title: 'Data Model' };

export default function DataModelPage() {
  return <EntityList entities={entities} />;
}
