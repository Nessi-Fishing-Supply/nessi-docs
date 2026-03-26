import { apiGroups } from '@/data';
import { ApiList } from '@/features/api-map/api-list';

export const metadata = { title: 'API Map' };

export default function ApiMapPage() {
  const totalEndpoints = apiGroups.reduce((sum, g) => sum + g.endpoints.length, 0);

  return (
    <ApiList
      groups={apiGroups}
      totalEndpoints={totalEndpoints}
    />
  );
}
