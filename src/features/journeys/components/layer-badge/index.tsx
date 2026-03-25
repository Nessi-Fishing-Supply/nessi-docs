import type { StepLayer } from '@/types/journey';
import styles from './layer-badge.module.scss';

type Props = {
  layer: StepLayer;
};

const LAYER_LABELS: Record<StepLayer, string> = {
  client: 'Client',
  server: 'Server',
  database: 'Database',
  background: 'Background',
  email: 'Email',
  external: 'External',
};

export default function LayerBadge({ layer }: Props) {
  return (
    <span className={styles.badge} data-layer={layer}>
      {LAYER_LABELS[layer]}
    </span>
  );
}
