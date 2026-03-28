'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ArchDiagram } from '@/types/architecture';
import { PageHeader } from '@/components/ui/page-header';
import styles from './architecture-list.module.scss';

interface ArchitectureListProps {
  diagrams: ArchDiagram[];
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  stack: { label: 'Stack', color: 'rgba(88,166,255,0.7)' },
  flow: { label: 'Flow', color: 'rgba(61,140,117,0.7)' },
  pipeline: { label: 'Pipeline', color: 'rgba(210,168,255,0.7)' },
};

export function ArchitectureList({ diagrams }: ArchitectureListProps) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const totalNodes = diagrams.reduce(
    (s, d) => s + d.layers.reduce((ls, l) => ls + l.nodes.length, 0),
    0,
  );
  const totalConnections = diagrams.reduce((s, d) => s + d.connections.length, 0);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Architecture"
        metrics={[
          { value: diagrams.length, label: 'diagrams' },
          { value: totalNodes, label: 'nodes' },
          { value: totalConnections, label: 'connections' },
        ]}
      />

      <div className={styles.list}>
        {diagrams.map((d, i) => {
          const nodeCount = d.layers.reduce((s, l) => s + l.nodes.length, 0);
          const cat = CATEGORY_CONFIG[d.category] ?? {
            label: d.category,
            color: 'rgba(106,104,96,0.5)',
          };

          return (
            <Link
              key={d.slug}
              href={`/architecture/${d.slug}`}
              className={styles.row}
              style={{
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateY(0)' : 'translateY(4px)',
                transition: `opacity 200ms ease-out ${i * 30}ms, transform 200ms ease-out ${i * 30}ms, background 150ms ease-out`,
              }}
            >
              <div className={styles.rowContent}>
                <div className={styles.rowTitle}>{d.title}</div>
                <div className={styles.rowDesc}>{d.description}</div>
              </div>
              <span
                className={styles.categoryBadge}
                style={{ background: `${cat.color}25`, color: cat.color }}
              >
                {cat.label}
              </span>
              <span className={styles.statCount}>{d.layers.length} layers</span>
              <span className={styles.statCount}>{nodeCount} nodes</span>
              <span className={styles.statCount}>{d.connections.length} edges</span>
              <span className={styles.chevron}>&rsaquo;</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
