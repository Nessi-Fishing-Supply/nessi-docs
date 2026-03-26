import { erdNodes, erdEdges } from '@/data/entity-relationships';
import { ErdCanvas } from '@/features/data-model/erd-canvas';

export const metadata = { title: 'Entity Relationships' };

export default function ErdPage() {
  return <ErdCanvas nodes={erdNodes} edges={erdEdges} />;
}
