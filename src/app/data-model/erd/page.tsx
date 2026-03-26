import { erdNodes, erdEdges } from '@/data';
import { ErdCanvas } from '@/features/data-model/erd-canvas';

export const metadata = { title: 'Entity Relationships' };

export default function ErdPage() {
  return <ErdCanvas nodes={erdNodes} edges={erdEdges} />;
}
