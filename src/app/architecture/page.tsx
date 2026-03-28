import { getAllArchDiagrams } from '@/data';
import { ArchitectureList } from '@/features/architecture/architecture-list';

export default function ArchitectureIndex() {
  const diagrams = getAllArchDiagrams();
  return <ArchitectureList diagrams={diagrams} />;
}
