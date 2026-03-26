import { apiGroups } from '@/data';
import { ApiList } from '@/features/api-map/api-list';

export const metadata = { title: 'API Map' };

export default function ApiMapPage() {
  return <ApiList groups={apiGroups} />;
}
