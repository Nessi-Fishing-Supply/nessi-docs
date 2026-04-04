'use client';

import type { StepLayer, StepStatus } from '@/features/journeys';
import { LAYER_CONFIG, STATUS_CONFIG } from '@/features/journeys';
import { hexToRgba } from '@/features/canvas/utils/geometry';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FilterControls {
  visibleLayers: Set<string>;
  visibleStatuses: Set<string>;
  onToggleLayer: (layer: StepLayer) => void;
  onToggleStatus: (status: StepStatus) => void;
}

/* ------------------------------------------------------------------ */
/*  FiltersDropup                                                      */
/* ------------------------------------------------------------------ */

export function FiltersDropup({ controls }: { controls: FilterControls }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 70,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15,19,25,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        backdropFilter: 'blur(12px)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 11,
        minWidth: 200,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 9,
            color: '#6a6860',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginRight: 4,
          }}
        >
          Layers
        </span>
        {(Object.entries(LAYER_CONFIG) as [StepLayer, (typeof LAYER_CONFIG)[StepLayer]][]).map(
          ([key, cfg]) => {
            const active = controls.visibleLayers.has(key);
            return (
              <button
                key={key}
                onClick={() => controls.onToggleLayer(key)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: 10,
                  border: active ? `1px solid ${cfg.color}` : '1px solid transparent',
                  background: hexToRgba(cfg.color, active ? 0.15 : 0.05),
                  color: active ? cfg.color : '#9a9790',
                  opacity: active ? 1 : 0.5,
                  cursor: 'pointer',
                }}
              >
                {cfg.label}
              </button>
            );
          },
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 9,
            color: '#6a6860',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginRight: 4,
          }}
        >
          Status
        </span>
        {(Object.entries(STATUS_CONFIG) as [StepStatus, (typeof STATUS_CONFIG)[StepStatus]][]).map(
          ([key, cfg]) => {
            const active = controls.visibleStatuses.has(key);
            return (
              <button
                key={key}
                onClick={() => controls.onToggleStatus(key)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: 10,
                  border: active ? `1px solid ${cfg.color}` : '1px solid transparent',
                  background: hexToRgba(cfg.color, active ? 0.15 : 0.05),
                  color: active ? cfg.color : '#9a9790',
                  opacity: active ? 1 : 0.5,
                  cursor: 'pointer',
                }}
              >
                {cfg.label}
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
