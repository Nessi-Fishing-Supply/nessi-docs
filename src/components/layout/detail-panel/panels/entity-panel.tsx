import type { Entity } from '@/features/data-model';
import { Badge } from '@/components/indicators';
import { SectionLabel } from '@/components/layout';
import { InfoBlock, KeyValueRow } from '@/components/data-display';
import styles from './panel-content.module.scss';

interface EntityPanelProps {
  entity: Entity;
}

export function EntityPanel({ entity }: EntityPanelProps) {
  return (
    <div>
      <h3 className={styles.panelTitleMono} style={{ color: 'var(--color-primary-400)' }}>
        {entity.name}
      </h3>
      <Badge variant="subtle">{entity.badge}</Badge>

      {entity.why && (
        <>
          <SectionLabel>Why this exists</SectionLabel>
          <InfoBlock>{entity.why}</InfoBlock>
        </>
      )}

      <SectionLabel>Fields ({entity.fields.length})</SectionLabel>

      <div className={styles.fieldTable}>
        {entity.fields.map((f) => (
          <KeyValueRow
            key={f.name}
            bordered
            label={<span className={styles.fieldName}>{f.name}</span>}
            value={
              <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={styles.fieldType}>{f.type}</span>
                <span className={styles.fieldDesc}>{f.description}</span>
              </span>
            }
          />
        ))}
      </div>
    </div>
  );
}
