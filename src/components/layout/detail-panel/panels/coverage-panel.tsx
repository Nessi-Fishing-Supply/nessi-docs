import type { Journey } from '@/types/journey';
import { PERSONA_CONFIG, LAYER_CONFIG } from '@/types/journey';
import { Badge, SectionLabel } from '@/components/ui';
import styles from './panel-content.module.scss';

interface CoveragePanelProps {
  journey: Journey;
}

export function CoveragePanel({ journey }: CoveragePanelProps) {
  const steps = journey.nodes.filter((n) => n.type === 'step');
  const personaCfg = PERSONA_CONFIG[journey.persona];

  const layerCounts = new Map<string, number>();
  for (const s of steps) {
    if (s.layer) layerCounts.set(s.layer, (layerCounts.get(s.layer) ?? 0) + 1);
  }

  return (
    <div>
      <h3 className={styles.panelTitle}>{journey.title}</h3>

      <div className={styles.badgeRow}>
        <Badge color={personaCfg.color}>{personaCfg.label}</Badge>
      </div>

      <p className={styles.description}>{journey.description}</p>

      <SectionLabel>Steps ({steps.length})</SectionLabel>
      <div className={styles.statRow}>
        {Array.from(layerCounts.entries()).map(([layer, count]) => {
          const cfg = LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG];
          return (
            <span key={layer} style={{ color: cfg?.color }}>
              {cfg?.label}: {count}
            </span>
          );
        })}
      </div>
    </div>
  );
}
