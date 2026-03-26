'use client';

import styles from './play-button.module.scss';

interface PlayButtonProps {
  onClick: () => void;
}

export function PlayButton({ onClick }: PlayButtonProps) {
  return (
    <button
      className={styles.button}
      onClick={onClick}
      title="Play through journey"
    >
      <span className={styles.icon}>&#9654;</span>
      <span className={styles.label}>Play</span>
    </button>
  );
}
