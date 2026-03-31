import styles from './canvas-empty-state.module.scss';

interface CanvasEmptyStateProps {
  message?: string;
}

export function CanvasEmptyState({
  message = 'No items match the current filters.',
}: CanvasEmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.icon}>{'\u2298'}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
