'use client';

import type { Journey } from '@/types/journey';
import { PERSONA_CONFIG, LAYER_CONFIG, STATUS_CONFIG } from '@/types/journey';
import { useDocsContext } from '@/providers/docs-provider';
import styles from './coverage-list.module.scss';

interface CoverageListProps {
  journeys: Journey[];
}

export function CoverageList({ journeys }: CoverageListProps) {
  const { selectedItem, setSelectedItem } = useDocsContext();

  const layerEntries = Object.entries(LAYER_CONFIG) as [keyof typeof LAYER_CONFIG, typeof LAYER_CONFIG[keyof typeof LAYER_CONFIG]][];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Journey Coverage</h2>
        <p className={styles.subtitle}>{journeys.length} journeys</p>
      </div>
      <div className={styles.legend}>
        {layerEntries.map(([key, cfg]) => (
          <span key={key} className={styles.legendItem} style={{ color: cfg.color }}>
            <span className={styles.legendKey}>{cfg.label.charAt(0)}</span>
            {cfg.label}
          </span>
        ))}
      </div>
      <div className={styles.grid}>
        {journeys.map((journey) => {
          const steps = journey.nodes.filter((n) => n.type === 'step');
          const total = steps.length;
          const built = steps.filter((s) => s.status === 'built' || s.status === 'tested').length;
          const tested = steps.filter((s) => s.status === 'tested').length;
          const builtPct = total > 0 ? Math.round((built / total) * 100) : 0;
          const testedPct = total > 0 ? Math.round((tested / total) * 100) : 0;
          const personaCfg = PERSONA_CONFIG[journey.persona];
          const isSelected = selectedItem?.type === 'coverage' && selectedItem.journey.slug === journey.slug;

          const layerCounts = new Map<string, number>();
          for (const s of steps) {
            if (s.layer) layerCounts.set(s.layer, (layerCounts.get(s.layer) ?? 0) + 1);
          }

          return (
            <button
              key={journey.slug}
              className={`${styles.card} ${isSelected ? styles.active : ''}`}
              onClick={() => setSelectedItem({ type: 'coverage', journey })}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{journey.title}</span>
                <span className={styles.persona} style={{ color: personaCfg.color }}>
                  {personaCfg.label}
                </span>
              </div>
              <div className={styles.stats}>
                <span>{total} steps</span>
                <span>·</span>
                <span style={{ color: STATUS_CONFIG.built.color }}>{builtPct}% built</span>
                <span>·</span>
                <span style={{ color: STATUS_CONFIG.tested.color }}>{testedPct}% tested</span>
              </div>
              <div className={styles.bar}>
                <div className={styles.barFill} style={{ width: `${builtPct}%`, background: STATUS_CONFIG.built.color }} />
              </div>
              <div className={styles.layers}>
                {Array.from(layerCounts.entries()).map(([layer, count]) => (
                  <span
                    key={layer}
                    className={styles.layerDot}
                    style={{ color: LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG]?.color }}
                    title={`${LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG]?.label}: ${count}`}
                  >
                    {LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG]?.label?.charAt(0)}{count}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
