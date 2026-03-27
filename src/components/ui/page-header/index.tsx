import styles from './page-header.module.scss';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  metrics?: Array<{ value: number | string; label: string }>;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, badge, metrics, children }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <div className={styles.titleLeft}>
          <h2 className={styles.title}>{title}</h2>
          {badge && <span className={styles.badge}>{badge}</span>}
        </div>

        {metrics && metrics.length > 0 && (
          <div className={styles.stats}>
            {metrics.map((m) => (
              <div key={m.label} className={styles.stat}>
                <span className={styles.statValue}>{m.value}</span>
                {m.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

      {children && <div className={styles.children}>{children}</div>}
    </div>
  );
}
