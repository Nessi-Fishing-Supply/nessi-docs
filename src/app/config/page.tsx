import { configEnums } from '@/data/config-reference';
import { ConfigList } from '@/features/config/config-list';

export const metadata = { title: 'Config Reference' };

export default function ConfigPage() {
  return <ConfigList enums={configEnums} />;
}
