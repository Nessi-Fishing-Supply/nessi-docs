import { getAllLifecycles } from '@/data';
import { LifecycleList } from '@/features/lifecycles/lifecycle-list';

export default function LifecyclesIndex() {
  const lifecycles = getAllLifecycles();
  return <LifecycleList lifecycles={lifecycles} />;
}
