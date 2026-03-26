import Link from 'next/link';
import styles from './breadcrumb.module.scss';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
}

export function Breadcrumb({ segments }: BreadcrumbProps) {
  return (
    <nav className={styles.breadcrumb}>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={seg.label} style={{ display: 'contents' }}>
            {i > 0 && <span className={styles.separator}>›</span>}
            {isLast || !seg.href ? (
              <span className={styles.current}>{seg.label}</span>
            ) : (
              <Link href={seg.href} className={styles.link}>{seg.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
