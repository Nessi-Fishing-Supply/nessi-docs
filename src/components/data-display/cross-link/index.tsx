import Link from 'next/link';

import styles from './cross-link.module.scss';

interface CrossLinkProps {
  href: string;
  children: React.ReactNode;
}

export function CrossLink({ href, children }: CrossLinkProps) {
  return (
    <Link href={href} className={styles.link}>
      {children} →
    </Link>
  );
}
