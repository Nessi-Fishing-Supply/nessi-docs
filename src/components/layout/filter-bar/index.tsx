import styles from './filter-bar.module.scss';

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return <div className={`${styles.bar} ${className ?? ''}`}>{children}</div>;
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  color?: string;
  count?: number;
}

export function FilterChip({ label, active, onToggle, color, count }: FilterChipProps) {
  return (
    <button
      className={`${styles.chip} ${active ? styles.chipActive : ''}`}
      onClick={onToggle}
      style={
        active && color
          ? ({
              '--chip-color': color,
              '--chip-bg': `${color}1a`,
              '--chip-border': `${color}33`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {label}
      {count != null && <span className={styles.chipCount}>{count}</span>}
    </button>
  );
}
