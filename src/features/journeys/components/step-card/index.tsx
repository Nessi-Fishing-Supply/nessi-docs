import type { Step } from '@/types/journey';
import LayerBadge from '@/features/journeys/components/layer-badge';
import styles from './step-card.module.scss';

type Props = {
  step: Step;
  index: number;
  isLast: boolean;
};

export default function StepCard({ step, index, isLast }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.timeline}>
        <div className={styles.dot} data-status={step.status} />
        {!isLast && <div className={styles.line} />}
      </div>

      <div className={styles.card} data-layer={step.layer}>
        <div className={styles.header}>
          <span className={styles.stepNumber}>{index + 1}</span>
          <h4 className={styles.label}>{step.label}</h4>
          <LayerBadge layer={step.layer} />
        </div>

        {(step.route || step.notes || step.errorCases) && (
          <div className={styles.details}>
            {step.route && (
              <div className={styles.route}>
                <code>{step.route}</code>
              </div>
            )}

            {step.notes && <p className={styles.notes}>{step.notes}</p>}

            {step.errorCases && step.errorCases.length > 0 && (
              <div className={styles.errors}>
                <span className={styles.errorsLabel}>Error cases:</span>
                <ul className={styles.errorList}>
                  {step.errorCases.map((err, i) => (
                    <li key={i} className={styles.errorItem}>
                      <span className={styles.errorCondition}>{err.condition}</span>
                      <span className={styles.errorResult}>
                        {err.httpStatus && (
                          <code className={styles.httpStatus}>{err.httpStatus}</code>
                        )}
                        {err.result}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step.codeRef && (
              <div className={styles.codeRef}>
                <code>{step.codeRef}</code>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
