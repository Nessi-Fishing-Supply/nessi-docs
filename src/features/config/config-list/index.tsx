'use client';

import { useState } from 'react';
import type { ConfigEnum } from '@/types/config-ref';
import { useDocsContext } from '@/providers/docs-provider';
import { PageHeader } from '@/components/ui/page-header';
import styles from './config-list.module.scss';

interface ConfigListProps {
  enums: ConfigEnum[];
}

export function ConfigList({ enums }: ConfigListProps) {
  const { setSelectedItem } = useDocsContext();
  const [openSlugs, setOpenSlugs] = useState<Set<string>>(new Set());

  const totalValues = enums.reduce((sum, e) => sum + e.values.length, 0);

  const toggleSlug = (slug: string) => {
    const willOpen = !openSlugs.has(slug);
    setOpenSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
    if (willOpen) {
      const enumDef = enums.find((e) => e.slug === slug);
      if (enumDef) setSelectedItem({ type: 'config-enum', configEnum: enumDef });
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <PageHeader
        title="Config Reference"
        metrics={[
          { value: enums.length, label: 'enums' },
          { value: totalValues, label: 'total values' },
        ]}
      />

      {/* Table of Contents */}
      <nav className={styles.toc}>
        {enums.map((e) => (
          <button
            key={e.slug}
            className={`${styles.tocItem} ${openSlugs.has(e.slug) ? styles.tocItemActive : ''}`}
            onClick={() => toggleSlug(e.slug)}
          >
            <span className={styles.tocName}>{e.name}</span>
            <span className={styles.tocCount}>{e.values.length}</span>
          </button>
        ))}
      </nav>

      {/* Enum Blocks */}
      <div className={styles.enums}>
        {enums.map((e) => {
          const isOpen = openSlugs.has(e.slug);
          return (
            <div
              key={e.slug}
              id={e.slug}
              className={`${styles.enumBlock} ${isOpen ? styles.enumOpen : ''}`}
            >
              <button className={styles.enumHeader} onClick={() => toggleSlug(e.slug)}>
                <span className={styles.enumName}>{e.name}</span>
                <span className={styles.enumCount}>{e.values.length} values</span>
                <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
              </button>

              {isOpen && (
                <div className={styles.enumBody}>
                  <p className={styles.enumDescription}>{e.description}</p>

                  <div className={styles.sourceRow}>
                    <span className={styles.sourceLabel}>Source</span>
                    <code className={styles.sourceValue}>{e.source}</code>
                  </div>

                  <div className={styles.valueTable}>
                    <div className={styles.valueHeader}>
                      <span>Value</span>
                      <span>Label</span>
                      <span>Description</span>
                    </div>
                    {e.values.map((v) => (
                      <div key={v.value} className={styles.valueRow}>
                        <span className={styles.valueCode}>{v.value}</span>
                        <span className={styles.valueLabel}>{v.label}</span>
                        <span className={styles.valueDesc}>{v.description ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
