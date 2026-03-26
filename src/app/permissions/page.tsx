import { roles } from '@/data/permissions';
import { PermissionsMatrix } from '@/features/permissions/permissions-matrix';

export const metadata = { title: 'Permissions' };

export default function PermissionsPage() {
  return <PermissionsMatrix roles={roles} />;
}
