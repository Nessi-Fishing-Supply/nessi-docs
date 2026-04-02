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
  colorBg?: string;
  colorBorder?: string;
  count?: number;
  className?: string;
}

export function FilterChip({
  label,
  active,
  onToggle,
  color,
  colorBg,
  colorBorder,
  count,
  className,
}: FilterChipProps) {
  return (
    <button
      className={`${styles.chip} ${active ? styles.chipActive : ''} ${className ?? ''}`}
      onClick={onToggle}
      style={
        active && color
          ? ({
              '--chip-color': color,
              '--chip-bg': colorBg ?? `${color}1a`,
              '--chip-border': colorBorder ?? `${color}33`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {label}
      {count != null && <span className={styles.chipCount}>{count}</span>}
    </button>
  );
}
