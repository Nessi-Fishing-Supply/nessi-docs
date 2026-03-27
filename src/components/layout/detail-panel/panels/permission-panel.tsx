import type { Role } from '@/types/permission';
import { PERMISSION_FEATURES, LEVEL_CONFIG } from '@/types/permission';
import { KeyValueRow } from '@/components/ui';
import styles from './panel-content.module.scss';

export function PermissionPanel({ role }: { role: Role }) {
  return (
    <div>
      <h3 style={{ fontSize: '14px', color: role.color, margin: '0 0 4px' }}>{role.name}</h3>
      <p className={styles.descriptionMuted}>{role.description}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {PERMISSION_FEATURES.map((f) => {
          const level = role.permissions[f.key];
          const cfg = LEVEL_CONFIG[level];
          return (
            <KeyValueRow key={f.key} label={f.label} value={cfg.label} valueColor={cfg.color} />
          );
        })}
      </div>
    </div>
  );
}
