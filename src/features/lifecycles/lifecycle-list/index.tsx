'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Lifecycle } from '@/types/lifecycle';
import { PageHeader } from '@/components/ui/page-header';
import styles from './lifecycle-list.module.scss';

interface LifecycleListProps {
  lifecycles: Lifecycle[];
}

function sourceColor(source?: string): string {
  switch (source) {
    case 'enum':
      return 'rgba(61,140,117,0.7)';
    case 'check_constraint':
      return 'rgba(226,119,57,0.7)';
    case 'typescript':
      return 'rgba(88,166,255,0.7)';
    default:
      return 'rgba(106,104,96,0.5)';
  }
}

function sourceLabel(source?: string): string {
  switch (source) {
    case 'enum':
      return 'enum';
    case 'check_constraint':
      return 'check';
    case 'typescript':
      return 'ts';
    default:
      return 'unknown';
  }
}

export function LifecycleList({ lifecycles }: LifecycleListProps) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const totalStates = lifecycles.reduce((s, l) => s + l.states.length, 0);
  const totalTransitions = lifecycles.reduce((s, l) => s + l.transitions.length, 0);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Lifecycles"
        metrics={[
          { value: lifecycles.length, label: 'lifecycles' },
          { value: totalStates, label: 'states' },
          { value: totalTransitions, label: 'transitions' },
        ]}
      />

      <div className={styles.list}>
        {lifecycles.map((lc, i) => (
          <Link
            key={lc.slug}
            href={`/lifecycles/${lc.slug}`}
            className={styles.row}
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? 'translateY(0)' : 'translateY(4px)',
              transition: `opacity 200ms ease-out ${i * 30}ms, transform 200ms ease-out ${i * 30}ms, background 150ms ease-out`,
            }}
          >
            <div className={styles.rowContent}>
              <div className={styles.rowTitle}>{lc.name}</div>
              <div className={styles.rowDesc}>{lc.description}</div>
            </div>
            <span
              className={styles.sourceBadge}
              style={{ background: `${sourceColor(lc.source)}25`, color: sourceColor(lc.source) }}
            >
              {sourceLabel(lc.source)}
            </span>
            <span className={styles.statCount}>{lc.states.length} states</span>
            <span className={styles.statCount}>{lc.transitions.length} transitions</span>
            <span className={styles.chevron}>&rsaquo;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
