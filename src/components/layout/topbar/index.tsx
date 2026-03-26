import Image from 'next/image';
import styles from './topbar.module.scss';

export function Topbar() {
  return (
    <div className={styles.topbar}>
      <div className={styles.brand}>
        <Image
          src="/logo_full.svg"
          alt="Nessi"
          width={68}
          height={27}
          className={styles.logo}
          priority
        />
        <span className={styles.docs}>Docs</span>
      </div>
      <a
        href="https://nessifishingsupply.com"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.productLink}
      >
        <span className={styles.productContext}>Documentation for</span>
        <span className={styles.productDomain}>nessifishingsupply.com</span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className={styles.linkIcon}>
          <path d="M4.5 2.5H2.5V9.5H9.5V7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <path d="M7 2.5H9.5V5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 2.5L5.5 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </a>
    </div>
  );
}
