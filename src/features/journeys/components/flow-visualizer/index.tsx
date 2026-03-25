import type { Flow } from '@/types/journey';
import StepCard from '@/features/journeys/components/step-card';
import styles from './flow-visualizer.module.scss';

type Props = {
  flow: Flow;
  flowIndex: number;
};

export default function FlowVisualizer({ flow, flowIndex }: Props) {
  const layers = [...new Set(flow.steps.map((s) => s.layer))];

  return (
    <section className={styles.flow} aria-labelledby={`flow-${flow.id}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.flowNumber}>{flowIndex + 1}</span>
          <div>
            <h3 id={`flow-${flow.id}`} className={styles.title}>
              {flow.title}
            </h3>
            {flow.trigger && <p className={styles.trigger}>Trigger: {flow.trigger}</p>}
          </div>
        </div>
        <div className={styles.layerSummary}>
          {layers.map((layer) => (
            <span key={layer} className={styles.layerDot} data-layer={layer} title={layer} />
          ))}
        </div>
      </div>

      <div className={styles.steps}>
        {flow.steps.map((step, i) => (
          <StepCard key={step.id} step={step} index={i} isLast={i === flow.steps.length - 1} />
        ))}
      </div>

      {flow.branches && flow.branches.length > 0 && (
        <div className={styles.branches}>
          {flow.branches.map((branch, i) => (
            <div key={i} className={styles.branch}>
              <div className={styles.branchCondition}>{branch.condition}</div>
              <div className={styles.branchPaths}>
                {branch.paths.map((path, j) => (
                  <div key={j} className={styles.branchPath}>
                    <span className={styles.branchLabel}>{path.label}</span>
                    <span className={styles.branchArrow}>
                      {path.goTo === 'END' ? 'End' : `→ ${path.goTo}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
