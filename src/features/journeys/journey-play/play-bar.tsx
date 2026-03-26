'use client';

import styles from './play-bar.module.scss';

interface PlayBarProps {
  stepCount: number;
  atDecision: boolean;
  onUndo: () => void;
  onStop: () => void;
}

export function PlayBar({ stepCount, atDecision, onUndo, onStop }: PlayBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.controls}>
        <button className={styles.btn} onClick={onStop} title="Exit play mode">
          ■
        </button>
        <button className={styles.btn} onClick={onUndo} title="Undo last step">
          ↩
        </button>
      </div>

      <div className={styles.info}>
        {atDecision ? (
          <span className={styles.hint}>Pick an option to continue</span>
        ) : (
          <span className={styles.stepCount}>
            Click the next node · {stepCount} visited
          </span>
        )}
      </div>
    </div>
  );
}
