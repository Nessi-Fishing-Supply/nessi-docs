import { apiGroups } from '@/data';
import { ErrorCatalog } from '@/features/errors/error-catalog';

export const metadata = { title: 'Error Catalog' };

export default function ErrorsPage() {
  return <ErrorCatalog groups={apiGroups} />;
}
