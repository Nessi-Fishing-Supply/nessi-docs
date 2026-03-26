import type { Lifecycle, LifecycleState } from '@/types/lifecycle';
import { DEFAULT_STATE_COLOR } from '@/types/lifecycle';
import { Badge, SectionLabel } from '@/components/ui';
import styles from './panel-content.module.scss';

interface LifecyclePanelProps {
  state: LifecycleState;
  lifecycle: Lifecycle;
}

export function LifecyclePanel({ state, lifecycle }: LifecyclePanelProps) {
  const stateColor = state.color ?? DEFAULT_STATE_COLOR;
  const incoming = lifecycle.transitions.filter((t) => t.to === state.id);
  const outgoing = lifecycle.transitions.filter((t) => t.from === state.id);

  return (
    <div>
      <h3 className={styles.panelTitle}>{state.label}</h3>

      <div className={styles.badgeRow}>
        <Badge color={stateColor}>{lifecycle.name}</Badge>
        <Badge variant="subtle">{lifecycle.badge}</Badge>
      </div>

      {incoming.length > 0 && (
        <>
          <SectionLabel spaced={false}>How you get here</SectionLabel>
          {incoming.map((t, i) => (
            <div key={i} className={styles.transitionRow}>
              <span className={styles.transitionMuted}>{t.from}</span>
              <span className={styles.transitionArrow}>→</span>
              <span>{t.label}</span>
            </div>
          ))}
        </>
      )}

      {outgoing.length > 0 && (
        <>
          <SectionLabel>Where it goes</SectionLabel>
          {outgoing.map((t, i) => (
            <div key={i} className={styles.transitionRow}>
              <span>{t.label}</span>
              <span className={styles.transitionArrow}>→</span>
              <span className={styles.transitionMuted}>{t.to}</span>
            </div>
          ))}
        </>
      )}

      {outgoing.length === 0 && (
        <div className={styles.terminalState}>
          Terminal state — no outgoing transitions
        </div>
      )}
    </div>
  );
}
