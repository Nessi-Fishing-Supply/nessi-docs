import styles from './device-gate.module.scss';

export function DeviceGate() {
  return (
    <div className={styles.gate}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <h1 className={styles.title}>Desktop Required</h1>
        <p className={styles.message}>
          Nessi Docs is a product team tool built for desktop screens. Please access it from a
          device with a larger display.
        </p>
        <div className={styles.url}>docs.nessifishingsupply.com</div>
      </div>
    </div>
  );
}
