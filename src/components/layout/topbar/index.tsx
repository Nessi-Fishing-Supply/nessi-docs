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
      <span className={styles.url}>docs.nessifishingsupply.com</span>
    </div>
  );
}
