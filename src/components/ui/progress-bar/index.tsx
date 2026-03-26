import styles from './progress-bar.module.scss';

interface ProgressBarProps {
  label: string;
  value: string;
  percent: number;
  color: string;
}

export function ProgressBar({ label, value, percent, color }: ProgressBarProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}
