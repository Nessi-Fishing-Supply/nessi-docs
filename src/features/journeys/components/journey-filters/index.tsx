'use client';

import { LAYER_CONFIG, STATUS_CONFIG, type StepLayer, type StepStatus } from '@/types/journey';
import { hexToRgba } from '@/features/canvas/utils/geometry';
import styles from './journey-filters.module.scss';

interface JourneyFiltersProps {
  visibleLayers: Set<string>;
  visibleStatuses: Set<string>;
  onToggleLayer: (layer: StepLayer) => void;
  onToggleStatus: (status: StepStatus) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function JourneyFilters({
  visibleLayers,
  visibleStatuses,
  onToggleLayer,
  onToggleStatus,
  isOpen,
  onToggleOpen,
}: JourneyFiltersProps) {
  return (
    <div className={styles.wrapper}>
      <button className={styles.toggle} onClick={onToggleOpen}>
        Filters {isOpen ? '\u25BE' : '\u25B8'}
      </button>
      {isOpen && (
        <div className={styles.bar}>
          <div className={styles.group}>
            <span className={styles.groupLabel}>Layers</span>
            {(Object.entries(LAYER_CONFIG) as [StepLayer, (typeof LAYER_CONFIG)[StepLayer]][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  className={`${styles.chip} ${visibleLayers.has(key) ? styles.active : ''}`}
                  style={
                    {
                      '--chip-color': cfg.color,
                      '--chip-bg': hexToRgba(cfg.color, visibleLayers.has(key) ? 0.15 : 0.05),
                    } as React.CSSProperties
                  }
                  onClick={() => onToggleLayer(key)}
                >
                  {cfg.label}
                </button>
              ),
            )}
          </div>
          <div className={styles.group}>
            <span className={styles.groupLabel}>Status</span>
            {(
              Object.entries(STATUS_CONFIG) as [StepStatus, (typeof STATUS_CONFIG)[StepStatus]][]
            ).map(([key, cfg]) => (
              <button
                key={key}
                className={`${styles.chip} ${visibleStatuses.has(key) ? styles.active : ''}`}
                style={
                  {
                    '--chip-color': cfg.color,
                    '--chip-bg': hexToRgba(cfg.color, visibleStatuses.has(key) ? 0.15 : 0.05),
                  } as React.CSSProperties
                }
                onClick={() => onToggleStatus(key)}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
