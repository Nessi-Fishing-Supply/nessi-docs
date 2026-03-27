import { configEnums, roles } from '@/data';
import { ConfigList } from '@/features/config/config-list';

export const metadata = { title: 'Config' };

export default function ConfigPage() {
  return <ConfigList enums={configEnums} roles={roles} />;
}
