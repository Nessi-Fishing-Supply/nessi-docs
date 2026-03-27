import { erdNodes, erdEdges, entities } from '@/data';
import { ErdCanvas } from '@/features/data-model/erd-canvas';

export const metadata = { title: 'Entity Relationships' };

export default function EntityRelationshipsPage() {
  return <ErdCanvas nodes={erdNodes} edges={erdEdges} entities={entities} />;
}
