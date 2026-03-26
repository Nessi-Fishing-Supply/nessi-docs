import type { Journey } from '@/types/journey';
import { PERSONA_CONFIG, STATUS_CONFIG } from '@/types/journey';
import { colorTint } from '@/constants/colors';
import { Badge, SectionLabel, ProgressBar } from '@/components/ui';
import styles from './panel-content.module.scss';

interface CoveragePanelProps {
  journey: Journey;
}

export function CoveragePanel({ journey }: CoveragePanelProps) {
  const steps = journey.nodes.filter((n) => n.type === 'step');
  const total = steps.length;
  const built = steps.filter((s) => s.status === 'built' || s.status === 'tested').length;
  const tested = steps.filter((s) => s.status === 'tested').length;
  const builtPct = total > 0 ? Math.round((built / total) * 100) : 0;
  const testedPct = total > 0 ? Math.round((tested / total) * 100) : 0;
  const planned = steps.filter((s) => s.status === 'planned');
  const builtUntested = steps.filter((s) => s.status === 'built');
  const personaCfg = PERSONA_CONFIG[journey.persona];

  return (
    <div>
      <h3 className={styles.panelTitle}>{journey.title}</h3>

      <div className={styles.badgeRow}>
        <Badge color={personaCfg.color}>{personaCfg.label}</Badge>
      </div>

      <p className={styles.description}>{journey.description}</p>

      <ProgressBar
        label="Built"
        value={`${builtPct}% (${built}/${total})`}
        percent={builtPct}
        color={STATUS_CONFIG.built.color}
      />
      <ProgressBar
        label="Tested"
        value={`${testedPct}% (${tested}/${total})`}
        percent={testedPct}
        color={STATUS_CONFIG.tested.color}
      />

      {planned.length > 0 && (
        <>
          <SectionLabel spaced={false}>Not Yet Built ({planned.length})</SectionLabel>
          {planned.map((s) => (
            <div
              key={s.id}
              className={styles.statusItem}
              style={{
                color: '#b84040',
                background: colorTint('#b84040', 0.06),
              }}
            >
              {s.label}
            </div>
          ))}
        </>
      )}

      {builtUntested.length > 0 && (
        <>
          <SectionLabel>Built but Untested ({builtUntested.length})</SectionLabel>
          {builtUntested.map((s) => (
            <div
              key={s.id}
              className={styles.statusItem}
              style={{
                color: '#e27739',
                background: colorTint('#e27739', 0.06),
              }}
            >
              {s.label}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
