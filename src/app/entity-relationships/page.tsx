import { erdNodes, erdEdges, entities } from '@/data';
import { getErdCategoryGroups } from '@/data/index';
import { ErdCanvas } from '@/features/data-model/erd-canvas';

export const metadata = { title: 'Entity Relationships' };

export default function EntityRelationshipsPage() {
  const categoryGroups = getErdCategoryGroups();
  return (
    <ErdCanvas
      nodes={erdNodes}
      edges={erdEdges}
      entities={entities}
      categoryGroups={categoryGroups}
    />
  );
}
