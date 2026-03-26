import type { ConfigEnum } from '@/types/config-ref';
import { SectionLabel, KeyValueRow } from '@/components/ui';
import styles from './panel-content.module.scss';

export function ConfigPanel({ configEnum }: { configEnum: ConfigEnum }) {
  return (
    <div>
      <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', margin: '0 0 4px' }}>
        {configEnum.name}
      </h3>
      <p className={styles.descriptionMuted}>{configEnum.description}</p>

      <SectionLabel spaced={false}>Source</SectionLabel>
      <code className={styles.sourceCode}>{configEnum.source}</code>

      <SectionLabel spaced={false}>Values ({configEnum.values.length})</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {configEnum.values.map((v) => (
          <KeyValueRow
            key={v.value}
            label={<code style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-primary-400)' }}>{v.value}</code>}
            value={v.label}
            valueColor="var(--text-muted)"
          />
        ))}
      </div>
    </div>
  );
}
